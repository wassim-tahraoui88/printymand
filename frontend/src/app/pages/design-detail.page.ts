import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { DesignerBadgeComponent } from '../components/rank-badge.component';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

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
  readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly designId = signal<number>(701);
  readonly design = computed(() => this.workflow.getDesignById(this.designId()) ?? this.workflow.designs()[0]);
  readonly supportedProducts = computed(() =>
    this.design() ? this.workflow.availableProductsForDesign(this.design()!.id) : [],
  );

  /** Multi-select: the buyer can order this design on several products at once. */
  readonly selectedProductIds = signal<number[]>([]);

  readonly platformMargin = computed(() => this.workflow.platformSettings().margin);

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
    return this.workflow
      .designs()
      .filter((x) => x.designerId === d.designerId && x.id !== d.id && x.status === 'ACTIVE' && (x.moderation ?? 'APPROVED') === 'APPROVED')
      .slice(0, 3);
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designId.set(Number(params.get('id') ?? 701));
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
