import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DEFAULT_PLACEMENT } from '../models/placement';
import type { Design, Product } from '../models/types';
import { PlatformStoreService } from '../services/platform-store.service';
import { ImageWithFallbackComponent } from './image-with-fallback.component';

@Component({
  selector: 'app-design-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageWithFallbackComponent],
  templateUrl: './design-card.html',
})
export class DesignCardComponent {
  private readonly store = inject(PlatformStoreService);

  readonly design = input.required<Design>();

  /**
   * Lowest total the buyer could pay (cheapest printable product + platform
   * margin). `Design.price` is a legacy design fee and is NOT what is charged,
   * so it is never shown. Null when nothing is printable yet.
   */
  readonly fromPrice = computed(() => this.store.designFromPrice(this.design()));
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
    return cfg?.defaultPlacement ?? DEFAULT_PLACEMENT;
  });
}
