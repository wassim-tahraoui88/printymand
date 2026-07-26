import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { DesignerBadgeComponent } from '../components/rank-badge.component';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import type { Design } from '../models/types';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

/**
 * Product Detail / preview page. NO variations here — the buyer only previews
 * the design and ticks which products they want it on, then proceeds to
 * "Customize your order" where variations + quantities are chosen.
 */
@Component({
  selector: 'app-design-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageWithFallbackComponent, DesignCardComponent, DesignerBadgeComponent],
  templateUrl: './design-detail.html',
})
export class DesignDetailPageComponent {
  readonly store = inject(PlatformStoreService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly designId = signal<number>(0);

  /**
   * The requested design, or undefined when it does not exist or the viewer is
   * not allowed to see it. Never falls back to another design — a bad id must
   * render the "not found" branch rather than silently showing something else.
   */
  readonly design = computed(() => {
    const found = this.store.getDesignById(this.designId());
    return found && this.canView(found) ? found : undefined;
  });

  readonly supportedProducts = computed(() => {
    const design = this.design();
    return design ? this.store.availableProductsForDesign(design.id) : [];
  });

  /**
   * Public detail pages show only live marketplace designs. Owners (and admins)
   * can still open their own drafts, private uploads and archived work.
   */
  private canView(design: Design): boolean {
    const user = this.auth.user();
    if (user?.role === 'admin') return true;
    if (design.isUserUpload) return design.uploadedByUserId === user?.id;
    if (design.designerId === user?.id) return true;
    return design.status === 'ACTIVE' && (design.moderation ?? 'APPROVED') === 'APPROVED';
  }

  /** Multi-select: the buyer can order this design on several products at once. */
  readonly selectedProductIds = signal<number[]>([]);

  readonly platformMargin = computed(() => this.store.platformSettings().margin);

  /**
   * Minimum total: sum of (floor price + platform margin) over the SELECTED
   * products. Falls back to the cheapest single product when nothing is ticked.
   */
  readonly fromPrice = computed(() => {
    const margin = this.platformMargin();
    const selected = this.supportedProducts().filter((p) => this.isSelected(p.id));
    if (selected.length) {
      return selected.reduce((sum, p) => sum + p.basePrice + margin, 0);
    }
    const prods = this.supportedProducts();
    if (!prods.length) return null;
    return Math.min(...prods.map((p) => p.basePrice)) + margin;
  });

  readonly hasSelection = computed(() => this.selectedProductIds().length > 0);

  /** Printers cannot place orders. */
  readonly canOrder = computed(() => this.auth.user()?.role !== 'printer');

  readonly moreByDesigner = computed(() => {
    const d = this.design();
    if (!d) return [];
    return this.store
      .storefrontDesigns(d.designerId)
      .filter((x) => x.id !== d.id)
      .slice(0, 3);
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designId.set(Number(params.get('id')) || 0);
      this.selectedProductIds.set([]);
    });
  }

  isSelected(id: number): boolean {
    return this.selectedProductIds().includes(id);
  }

  toggleProduct(id: number): void {
    const set = new Set(this.selectedProductIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedProductIds.set([...set]);
  }
}
