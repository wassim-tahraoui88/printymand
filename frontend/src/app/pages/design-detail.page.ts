import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import { ProductCardComponent } from '../components/product-card.component';
import { DesignerBadgeComponent } from '../components/rank-badge.component';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-design-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageWithFallbackComponent, ProductCardComponent, DesignerBadgeComponent],
  templateUrl: './design-detail.html',
})
export class DesignDetailPageComponent {
  private readonly workflow = inject(WorkflowService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly designId = signal<number>(701);
  readonly design = computed(() => this.workflow.getDesignById(this.designId()) ?? this.workflow.designs()[0]);
  readonly supportedProducts = computed(() => (this.design() ? this.workflow.availableProductsForDesign(this.design()!.id) : []));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designId.set(Number(params.get('id') ?? 701));
    });
  }
}
