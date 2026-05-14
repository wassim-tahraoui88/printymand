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
    <article class="pm-card group" style="cursor:default;">
      <div style="position:relative; overflow:hidden;">
        <div style="position:absolute; inset:0 0 auto; z-index:10; display:flex; align-items:flex-start; justify-content:space-between; padding:0.875rem;">
          <span class="pm-chip" style="backdrop-filter:blur(8px);">{{ product().category }}</span>
          <span class="pm-chip"
            [style.background]="product().availability === 'ACTIVE' ? 'var(--pm-success-soft)' : 'var(--pm-surface-alt)'"
            [style.color]="product().availability === 'ACTIVE' ? 'var(--pm-success)' : 'var(--pm-text-muted)'"
            style="backdrop-filter:blur(8px);">{{ product().availability }}</span>
        </div>
        <app-image-with-fallback
          [src]="currentImage()"
          [alt]="product().name"
          [imgClass]="'h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'"
        />
        @if (product().images.length > 1) {
          <div style="position:absolute; bottom:0.875rem; right:0.875rem; z-index:10; display:flex; gap:0.375rem; background:rgba(0,0,0,0.45); border-radius:999px; padding:0.375rem 0.5rem; backdrop-filter:blur(8px);">
            @for (image of product().images; track image; let index = $index) {
              <button type="button"
                style="width:0.5rem; height:0.5rem; border-radius:999px; border:none; cursor:pointer; padding:0; transition:background 200ms;"
                [style.background]="index === imageIndex() ? '#fff' : 'rgba(255,255,255,0.35)'"
                (click)="imageIndex.set(index)"></button>
            }
          </div>
        }
      </div>

      <div style="padding:1.25rem; display:grid; gap:0.875rem;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem;">
          <div>
            <h3 class="pm-heading" style="font-size:1.05rem; font-weight:700; color:var(--pm-text); line-height:1.3;">{{ product().name }}</h3>
            <p style="font-size:0.82rem; color:var(--pm-text-muted); margin-top:0.2rem;">{{ product().printerName }}</p>
          </div>
          <span class="pm-heading" style="font-size:1.05rem; font-weight:700; color:var(--pm-text); white-space:nowrap;">{{ product().basePrice }} TND</span>
        </div>

        <p class="line-clamp-2" style="font-size:0.85rem; line-height:1.6; color:var(--pm-text-muted);">{{ product().description }}</p>

        <div style="display:flex; flex-wrap:wrap; gap:0.375rem;">
          @for (color of product().colors.slice(0, 4); track color) {
            <span class="pm-color-chip">
              <span class="pm-swatch" [style.background]="color"></span>
              {{ color }}
            </span>
          }
        </div>

        <div class="pm-metric" style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem;">
          <div>
            <p style="font-size:0.68rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--pm-text-muted);">Sizes</p>
            <p style="font-size:0.82rem; font-weight:600; color:var(--pm-text); margin-top:0.25rem;">{{ product().sizes.join(' · ') }}</p>
          </div>
          <span class="pm-chip" style="background:var(--pm-accent-soft); color:var(--pm-accent);">{{ product().colors.length }} colors</span>
        </div>

        <div style="border-top:1px solid var(--pm-border); padding-top:1rem; display:flex; justify-content:flex-end;">
          <a class="pm-btn pm-btn-primary" style="font-size:0.85rem;" [routerLink]="['/marketplace']" [queryParams]="{ product: product().id }">Choose design →</a>
        </div>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly imageIndex = signal(0);
  readonly currentImage = computed(() => this.product().images[this.imageIndex()] ?? this.product().images[0] ?? '/placeholder-image.svg');
}
