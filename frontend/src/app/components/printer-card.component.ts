import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import type { PrinterPartner } from '../models/types';
import { ImageWithFallbackComponent } from './image-with-fallback.component';
import { PrinterBadgeComponent } from './rank-badge.component';

@Component({
  selector: 'app-printer-card',
  standalone: true,
  imports: [CommonModule, ImageWithFallbackComponent, PrinterBadgeComponent],
  template: `
    <article class="pm-card">
      <div class="relative overflow-hidden rounded-xl">
        <app-image-with-fallback
          [src]="currentImage()"
          [alt]="printer().businessName"
          [imgClass]="'h-56 w-full object-cover'"
        />
      </div>

      <div class="space-y-4 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-slate-950">{{ printer().businessName }}</h3>
            <p class="text-sm text-slate-500">{{ printer().location }}</p>
          </div>
          <app-printer-badge [rank]="printer().rank" />
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-sm">
          <div class="rounded-xl bg-slate-50 p-2">
            <div class="font-semibold text-slate-950">{{ printer().rating }}</div>
            <div class="text-xs text-slate-500">rating</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-2">
            <div class="font-semibold text-slate-950">{{ printer().fulfillmentRate }}%</div>
            <div class="text-xs text-slate-500">fulfilled</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-2">
            <div class="font-semibold text-slate-950">{{ printer().deliveryDays }}d</div>
            <div class="text-xs text-slate-500">lead time</div>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-200 pt-3">
          <p class="text-sm text-slate-500">{{ printer().reviews }} reviews</p>
          <button type="button" class="pm-btn pm-btn-primary" (click)="selected.emit(printer().id)">Select printer</button>
        </div>
      </div>
    </article>
  `,
})
export class PrinterCardComponent {
  readonly printer = input.required<PrinterPartner>();
  readonly selected = output<number>();
  readonly activeIndex = signal(0);
  readonly currentImage = computed(() => this.printer().images[this.activeIndex()] ?? this.printer().images[0] ?? '/placeholder-image.svg');
}
