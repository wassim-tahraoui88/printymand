import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { DesignerBadgeComponent } from '../components/rank-badge.component';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-design-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageWithFallbackComponent, DesignCardComponent, DesignerBadgeComponent],
  templateUrl: './design-detail.html',
})
export class DesignDetailPageComponent {
  readonly workflow = inject(WorkflowService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly designId = signal<number>(701);
  readonly design = computed(() => this.workflow.getDesignById(this.designId()) ?? this.workflow.designs()[0]);
  readonly supportedProducts = computed(() =>
    this.design() ? this.workflow.availableProductsForDesign(this.design()!.id) : [],
  );

  readonly selectedProductId = signal<number | null>(null);
  readonly selectedColor = signal<string>('');
  readonly selectedSize = signal<string>('');

  readonly selectedProduct = computed(() => {
    const id = this.selectedProductId();
    const prods = this.supportedProducts();
    if (id) return this.workflow.getProductById(id) ?? prods[0] ?? null;
    return prods[0] ?? null;
  });

  readonly effectiveColor = computed(() => this.selectedColor() || this.selectedProduct()?.colors[0] || '');
  readonly effectiveSize  = computed(() => this.selectedSize()  || this.selectedProduct()?.sizes[0]  || '');

  readonly selectedPrinter = computed(() => {
    const p = this.selectedProduct();
    return p ? (this.workflow.getPrinterById(p.printerId) ?? null) : null;
  });

  /** Spec pricing: customer price = printer base price + fixed platform margin. */
  readonly platformMargin = computed(() => this.workflow.platformSettings().margin);
  readonly totalPrice = computed(() => {
    const p = this.selectedProduct();
    if (!p) return null;
    return p.basePrice + this.platformMargin();
  });

  readonly moreByDesigner = computed(() => {
    const d = this.design();
    if (!d) return [];
    return this.workflow
      .designs()
      .filter((x) => x.designerId === d.designerId && x.id !== d.id && x.status === 'ACTIVE')
      .slice(0, 3);
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designId.set(Number(params.get('id') ?? 701));
      this.selectedProductId.set(null);
      this.selectedColor.set('');
      this.selectedSize.set('');
    });
  }

  selectProduct(id: number): void {
    this.selectedProductId.set(id);
    this.selectedColor.set('');
    this.selectedSize.set('');
  }
}
