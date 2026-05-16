import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

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
  readonly availableProducts = computed(() => (this.design() ? this.workflow.availableProductsForDesign(this.design()!.id) : []));
  readonly selectedProductId = signal<number | null>(null);
  readonly selectedProduct = computed(() => (this.selectedProductId() ? this.workflow.getProductById(this.selectedProductId()!) : this.availableProducts()[0]));
  readonly selectedColor = signal('white');
  readonly selectedSize = signal('M');
  readonly position = signal({ x: 50, y: 48 });
  readonly scale = signal(0.42);
  readonly error = signal('');

  /**
   * Spec "Customization Rule": a designer's marketplace design is always preserved
   * exactly as intended — this page is preview-only for it. Repositioning/scaling
   * is allowed ONLY for the customer's own uploaded artwork.
   */
  readonly customizationLocked = computed(() => {
    const d = this.design();
    return !!d && !d.isUserUpload;
  });

  private dragPointerId: number | null = null;
  private dragOffset = { x: 0, y: 0 };

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const designId = Number(params.get('id') ?? 701);
      this.designId.set(designId);
      const qp = this.route.snapshot.queryParamMap;
      const preferredProduct = Number(qp.get('product'));
      const preferredColor = qp.get('color') ?? '';
      const preferredSize  = qp.get('size')  ?? '';
      const supportedProducts = this.workflow.availableProductsForDesign(designId);
      const product = supportedProducts.find((entry) => entry.id === preferredProduct) ?? supportedProducts[0];
      if (product) {
        this.selectedProductId.set(product.id);
        this.selectedColor.set(preferredColor || product.colors[0] || 'white');
        this.selectedSize.set(preferredSize  || product.sizes[0]  || 'M');
      }

      const config = product ? this.workflow.getDesignConfig(designId, product.id) : undefined;
      if (config) {
        this.position.set({ x: config.defaultPlacement.x, y: config.defaultPlacement.y });
        this.scale.set(config.defaultPlacement.scale);
        if (!preferredColor) this.selectedColor.set(config.availableColors[0] ?? this.selectedColor());
      }
    });
  }

  onProductChange(productId: number | string): void {
    const value = Number(productId);
    this.selectedProductId.set(value);
    const product = this.workflow.getProductById(value);
    if (product) {
      this.selectedColor.set(product.colors[0] ?? 'white');
      this.selectedSize.set(product.sizes[0] ?? 'M');
    }
    const config = this.workflow.getDesignConfig(this.design()!.id, value);
    if (config) {
      this.position.set({ x: config.defaultPlacement.x, y: config.defaultPlacement.y });
      this.scale.set(config.defaultPlacement.scale);
      this.selectedColor.set(config.availableColors[0] ?? this.selectedColor());
    }
  }

  updateScale(event: Event): void {
    if (this.customizationLocked()) return;
    const value = Number((event.target as HTMLInputElement).value);
    this.scale.set(Math.max(0.1, Math.min(1, value)));
  }

  resetPlacement(): void {
    if (this.customizationLocked()) return;
    this.position.set({ x: 50, y: 48 });
    this.scale.set(0.42);
  }

  startDrag(event: PointerEvent, host: HTMLElement): void {
    if (this.customizationLocked()) return;
    event.preventDefault();
    const rect = host.getBoundingClientRect();
    const pointer = this.pointerToPercent(event, rect);
    const current = this.position();
    this.dragPointerId = event.pointerId;
    this.dragOffset = {
      x: pointer.x - current.x,
      y: pointer.y - current.y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onCanvasMove(event: PointerEvent, host: HTMLElement): void {
    if (this.customizationLocked()) return;
    if (this.dragPointerId !== event.pointerId) return;
    const rect = host.getBoundingClientRect();
    const pointer = this.pointerToPercent(event, rect);
    this.position.set({
      x: Math.max(15, Math.min(85, pointer.x - this.dragOffset.x)),
      y: Math.max(15, Math.min(85, pointer.y - this.dragOffset.y)),
    });
  }

  endDrag(event: PointerEvent): void {
    if (this.dragPointerId === event.pointerId) {
      this.dragPointerId = null;
    }
  }

  continueToPrinterSelection(): void {
    const user = this.auth.user();
    const design = this.design();
    const product = this.selectedProduct();

    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }
    if (!design || !product) {
      this.error.set('Choose a product before continuing.');
      return;
    }

    this.workflow.setDraft({
      designId: design.id,
      productId: product.id,
      selectedColor: this.selectedColor(),
      selectedSize: this.selectedSize(),
      selectedPrinterId: null,
      placement: {
        x: this.position().x,
        y: this.position().y,
        scale: this.scale(),
      },
    });

    this.router.navigate(['/printers', design.id], { queryParams: { product: product.id } });
  }

  private pointerToPercent(event: PointerEvent, rect: DOMRect) {
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  }
}
