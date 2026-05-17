import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import type { Design, Product } from '../models/types';
import { ImageWithFallbackComponent } from './image-with-fallback.component';

@Component({
  selector: 'app-design-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageWithFallbackComponent],
  templateUrl: './design-card.html',
})
export class DesignCardComponent {
  readonly design = input.required<Design>();
  readonly preferredProductId = input<number | null>(null);

  /**
   * When set, the card shows the design composited onto this product's mockup
   * (TeePublic-style product-first browsing).
   */
  readonly product = input<Product | null>(null);

  /**
   * Owner (designer) view on their own storefront: no buyer CTA, the whole card
   * links into the dashboard editor for that design.
   */
  readonly ownerEditMode = input<boolean>(false);

  /** Designer-defined placement of this design on the previewed product. */
  readonly placement = computed(() => {
    const p = this.product();
    const cfg = p ? this.design().productConfigurations.find((c) => c.productId === p.id) : undefined;
    return cfg?.defaultPlacement ?? { x: 50, y: 48, scale: 0.42 };
  });

  readonly statusTone = computed(() => {
    const map: Record<Design['status'], string> = {
      ACTIVE: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
      ARCHIVED: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
      REMOVED: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    };
    return map[this.design().status];
  });
}
