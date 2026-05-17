import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import type { Product } from '../models/types';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

interface ItemConfig {
  color: string;
  size: string;
  quantity: number;
}

/**
 * "Customize your order": the buyer sees the design previewed on each product
 * they picked, selects variations (predefined colors/sizes) and quantities,
 * then proceeds to printer selection. No variation pickers exist before this.
 */
@Component({
  selector: 'app-customize-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageWithFallbackComponent],
  templateUrl: './customize.html',
})
export class CustomizePageComponent {
  readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly designId = signal<number>(701);
  readonly design = computed(() => this.workflow.getDesignById(this.designId()) ?? this.workflow.designs()[0]);

  /** Products chosen on the detail page (?products=1,2,3). */
  readonly productIds = signal<number[]>([]);
  readonly products = computed<Product[]>(() =>
    this.productIds()
      .map((id) => this.workflow.getProductById(id))
      .filter((p): p is Product => !!p),
  );

  /** Per-product variation + quantity, keyed by product id. */
  readonly config = signal<Record<number, ItemConfig>>({});
  readonly error = signal('');

  readonly platformMargin = computed(() => this.workflow.platformSettings().margin);
  readonly fromTotal = computed(() =>
    this.products().reduce((sum, p) => sum + (p.basePrice + this.platformMargin()) * this.cfg(p.id).quantity, 0),
  );

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const designId = Number(params.get('id') ?? 701);
      this.designId.set(designId);
      const qp = this.route.snapshot.queryParamMap;
      const raw = (qp.get('products') ?? qp.get('product') ?? '').trim();
      const supported = this.workflow.availableProductsForDesign(designId);
      let ids = raw
        ? raw.split(',').map((v) => Number(v.trim())).filter((n) => supported.some((p) => p.id === n))
        : [];
      if (!ids.length && supported.length) ids = [supported[0].id];
      this.productIds.set(ids);

      const cfg: Record<number, ItemConfig> = {};
      for (const id of ids) {
        cfg[id] = {
          color: this.colorsFor(id)[0] ?? 'white',
          size: this.sizesFor(id)[0] ?? 'One Size',
          quantity: 1,
        };
      }
      this.config.set(cfg);
    });
  }

  /** Colors the designer enabled for this product (fallback: product colors). */
  colorsFor(productId: number): string[] {
    const cfg = this.workflow.getDesignConfig(this.designId(), productId);
    if (cfg?.availableColors?.length) return cfg.availableColors;
    return this.workflow.getProductById(productId)?.colors ?? [];
  }

  sizesFor(productId: number): string[] {
    const cfg = this.workflow.getDesignConfig(this.designId(), productId);
    if (cfg?.availableSizes?.length) return cfg.availableSizes;
    return this.workflow.getProductById(productId)?.sizes ?? [];
  }

  /** Designer-defined placement of the design on this product. */
  placement(productId: number): { x: number; y: number; scale: number } {
    return (
      this.workflow.getDesignConfig(this.designId(), productId)?.defaultPlacement ?? { x: 50, y: 48, scale: 0.42 }
    );
  }

  cfg(productId: number): ItemConfig {
    return this.config()[productId] ?? { color: 'white', size: 'One Size', quantity: 1 };
  }

  patch(productId: number, patch: Partial<ItemConfig>): void {
    const current = this.cfg(productId);
    this.config.set({ ...this.config(), [productId]: { ...current, ...patch } });
  }

  setQuantity(productId: number, value: number): void {
    this.patch(productId, { quantity: Math.max(1, Math.min(99, Math.round(value || 1))) });
  }

  continueToPrinterSelection(): void {
    const user = this.auth.user();
    const design = this.design();
    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }
    if (user.role === 'printer') {
      this.error.set('Printer accounts cannot place orders.');
      return;
    }
    if (!design || !this.products().length) {
      this.error.set('Select at least one product before continuing.');
      return;
    }

    this.workflow.setDraft({
      designId: design.id,
      selectedPrinterId: null,
      items: this.products().map((p) => {
        const c = this.cfg(p.id);
        const pl = this.placement(p.id);
        return {
          productId: p.id,
          color: c.color,
          size: c.size,
          quantity: c.quantity,
          placement: { x: pl.x, y: pl.y, scale: pl.scale },
        };
      }),
    });

    this.router.navigate(['/printers', design.id]);
  }
}
