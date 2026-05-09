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
    <article class="pm-card pm-glow group">
      <div class="relative overflow-hidden rounded-[24px]">
        <div class="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
          <span class="pm-chip bg-slate-950/65 text-slate-100 backdrop-blur-xl">{{ product().category }}</span>
          <span class="pm-chip bg-emerald-400/10 text-emerald-200 backdrop-blur-xl">{{ product().availability }}</span>
        </div>
        <app-image-with-fallback
          [src]="currentImage()"
          [alt]="product().name"
          [imgClass]="'h-72 w-full object-cover transition duration-500 group-hover:scale-[1.04]'"
        />
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent"></div>
        @if (product().images.length > 1) {
          <div class="absolute bottom-4 right-4 z-10 flex gap-2 rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 shadow-xl shadow-slate-950/40 backdrop-blur-xl">
            @for (image of product().images; track image; let index = $index) {
              <button
                type="button"
                class="h-2.5 w-2.5 rounded-full"
                [class]="index === imageIndex() ? 'bg-white' : 'bg-white/35'"
                (click)="imageIndex.set(index)"
              ></button>
            }
          </div>
        }
      </div>

      <div class="space-y-5 p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="pm-heading text-xl font-semibold text-white">{{ product().name }}</h3>
            <p class="text-sm text-slate-400">{{ product().printerName }}</p>
          </div>
          <span class="text-lg font-semibold text-white">{{ product().basePrice }} TND</span>
        </div>

        <p class="line-clamp-2 text-sm leading-6 text-slate-300">{{ product().description }}</p>

        <div class="flex flex-wrap gap-2">
          @for (color of product().colors.slice(0, 4); track color) {
            <span class="pm-color-chip">
              <span class="pm-swatch" [style.background]="color"></span>
              {{ color }}
            </span>
          }
        </div>

        <div class="pm-metric flex items-center justify-between gap-3 text-sm">
          <div>
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Available sizes</p>
            <p class="mt-1 text-sm font-medium text-slate-200">{{ product().sizes.join(' • ') }}</p>
          </div>
          <span class="pm-chip bg-sky-400/10 text-sky-100">{{ product().colors.length }} colors</span>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
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
