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
    <article class="pm-card">
      <div class="relative overflow-hidden rounded-xl">
        <app-image-with-fallback
          [src]="currentImage()"
          [alt]="product().name"
          [imgClass]="'h-64 w-full object-cover'"
        />
        @if (product().images.length > 1) {
          <div class="absolute bottom-3 right-3 flex gap-2 rounded-full bg-white/90 px-2 py-1 shadow-sm">
            @for (image of product().images; track image; let index = $index) {
              <button
                type="button"
                class="h-2.5 w-2.5 rounded-full"
                [class]="index === imageIndex() ? 'bg-slate-900' : 'bg-slate-300'"
                (click)="imageIndex.set(index)"
              ></button>
            }
          </div>
        }
      </div>

      <div class="space-y-4 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{{ product().category }}</p>
            <h3 class="text-lg font-semibold text-slate-950">{{ product().name }}</h3>
          </div>
          <span class="pm-chip">{{ product().availability }}</span>
        </div>

        <p class="line-clamp-2 text-sm text-slate-600">{{ product().description }}</p>

        <div class="flex flex-wrap gap-2">
          @for (color of product().colors.slice(0, 4); track color) {
            <span class="pm-color-chip">
              <span class="pm-swatch" [style.background]="color"></span>
              {{ color }}
            </span>
          }
        </div>

        <div class="flex items-center justify-between text-sm">
          <div class="text-slate-500">
            {{ product().sizes.join(' • ') }}
          </div>
          <span class="font-semibold text-slate-950">{{ product().basePrice }} TND</span>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <div class="text-sm text-slate-500">{{ product().printerName }}</div>
          <div class="flex items-center gap-2">
            <a class="pm-btn pm-btn-secondary" [routerLink]="['/marketplace']" [queryParams]="{ product: product().id }">Choose design</a>
          </div>
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
