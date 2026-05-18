import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import type { Product } from '../models/types';
import { ImageWithFallbackComponent } from './image-with-fallback.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageWithFallbackComponent],
  template: `
    <article class="plate group">
      <a
        [routerLink]="['/marketplace']"
        [queryParams]="{ product: product().id }"
        style="display:block;"
        [attr.aria-label]="'Browse designs on ' + product().name"
      >
        <div class="plate-image">
          <app-image-with-fallback
            [src]="currentImage()"
            [alt]="product().name"
            [imgClass]="'w-full h-full object-cover'"
          />
          <span class="plate-no">{{ product().category }}</span>
          @if (product().images.length > 1) {
            <div style="position:absolute; bottom:10px; right:10px; z-index:10; display:flex; gap:0.3rem;">
              @for (img of product().images; track img; let i = $index) {
                <button
                  type="button"
                  style="width:0.75rem; height:0.75rem; border-radius:999px; border:1px solid rgba(255,255,255,0.6); cursor:pointer; padding:0; transition:background 200ms;"
                  [style.background]="i === imageIndex() ? '#fff' : 'rgba(255,255,255,0.25)'"
                  [attr.aria-label]="'View image ' + (i + 1)"
                  (click)="$event.preventDefault(); $event.stopPropagation(); imageIndex.set(i)"
                ></button>
              }
            </div>
          }
        </div>
      </a>

      <div class="plate-caption">
        <a
          [routerLink]="['/marketplace']"
          [queryParams]="{ product: product().id }"
          class="title"
          style="color:inherit;"
        >{{ product().name }}</a>
        <span class="price">{{ product().basePrice }} TND</span>
        <span class="designer">{{ product().colors.length }} colour{{ product().colors.length === 1 ? '' : 's' }} · {{ product().sizes.join(' · ') }}</span>
        <span class="meta">{{ product().rating.toFixed(1) }} ★ · {{ product().leadTimeDays }}d lead</span>
      </div>

      <div style="padding-top:12px;">
        <a
          class="btn btn-clay"
          style="width:100%; justify-content:center;"
          [routerLink]="['/marketplace']"
          [queryParams]="{ product: product().id }"
        >Browse designs <span class="ar">→</span></a>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly imageIndex = signal(0);
  readonly currentImage = computed(() => this.product().images[this.imageIndex()] ?? this.product().images[0] ?? '/placeholder-image.svg');
}
