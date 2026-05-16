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
    <article class="pm-card group">
      <!-- Image -->
      <div style="position:relative; overflow:hidden;">
        <span class="pm-chip" style="position:absolute; top:0.75rem; left:0.75rem; z-index:10; backdrop-filter:blur(8px);">{{ product().category }}</span>
        <app-image-with-fallback
          [src]="currentImage()"
          [alt]="product().name"
          [imgClass]="'h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'"
        />
        @if (product().images.length > 1) {
          <div style="position:absolute; bottom:0.75rem; right:0.75rem; z-index:10; display:flex; gap:0.3rem; background:rgba(0,0,0,0.42); border-radius:999px; padding:0.3rem 0.45rem; backdrop-filter:blur(8px);">
            @for (img of product().images; track img; let i = $index) {
              <button
                type="button"
                style="width:0.45rem; height:0.45rem; border-radius:999px; border:none; cursor:pointer; padding:0; transition:background 200ms;"
                [style.background]="i === imageIndex() ? '#fff' : 'rgba(255,255,255,0.35)'"
                [attr.aria-label]="'View image ' + (i + 1)"
                (click)="imageIndex.set(i)"
              ></button>
            }
          </div>
        }
      </div>

      <!-- Body -->
      <div style="padding:1.125rem; display:grid; gap:0.75rem;">
        <!-- Name + price -->
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem;">
          <div style="min-width:0;">
            <h3 class="pm-heading line-clamp-1" style="font-size:1rem; font-weight:700; color:var(--pm-text); line-height:1.3;">{{ product().name }}</h3>
            <p style="font-size:var(--pm-text-xs); color:var(--pm-text-muted); margin-top:0.15rem;">{{ product().category }}</p>
          </div>
          <p class="pm-heading" style="font-size:1rem; font-weight:800; color:var(--pm-text); white-space:nowrap; flex-shrink:0;">
            {{ product().basePrice }} <span style="font-size:var(--pm-text-xs); font-weight:500; color:var(--pm-text-muted);">TND</span>
          </p>
        </div>

        <!-- Rating + lead time -->
        <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
          <span class="pm-stars">{{ product().rating.toFixed(1) }} ★</span>
          <span style="font-size:var(--pm-text-xs); color:var(--pm-text-muted);">({{ product().totalOrders }})</span>
          <span style="flex:1;"></span>
          <span style="display:inline-flex; align-items:center; gap:0.2rem; font-size:var(--pm-text-xs); font-weight:600; color:var(--pm-text-muted);">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ product().leadTimeDays }}d lead
          </span>
        </div>

        <!-- Color swatches + sizes -->
        <div style="display:flex; align-items:center; gap:0.3rem; flex-wrap:wrap;">
          @for (color of product().colors.slice(0, 6); track color) {
            <span
              style="width:1.125rem; height:1.125rem; border-radius:50%; border:1.5px solid var(--pm-border-strong); flex-shrink:0;"
              [style.background]="color"
              [title]="color"
            ></span>
          }
          @if (product().colors.length > 6) {
            <span style="font-size:var(--pm-text-xs); color:var(--pm-text-muted);">+{{ product().colors.length - 6 }}</span>
          }
          <span style="flex:1;"></span>
          <span style="font-size:var(--pm-text-xs); color:var(--pm-text-muted); font-weight:600;">{{ product().sizes.join(' · ') }}</span>
        </div>

        <!-- CTA -->
        <div style="border-top:1px solid var(--pm-border); padding-top:0.875rem;">
          <a
            class="pm-btn pm-btn-primary pm-btn-sm"
            style="width:100%; justify-content:center;"
            [routerLink]="['/marketplace']"
            [queryParams]="{ product: product().id }"
          >Browse designs →</a>
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
