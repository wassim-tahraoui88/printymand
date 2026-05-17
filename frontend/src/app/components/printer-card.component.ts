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
    <article class="pm-card group">
      <div style="overflow:hidden;">
        <app-image-with-fallback
          [src]="currentImage()"
          [alt]="printer().businessName"
          [imgClass]="'h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'"
        />
      </div>

      <div style="padding:1.25rem; display:grid; gap:0.875rem;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem;">
          <div>
            <h3 class="pm-heading" style="font-size:1.05rem; font-weight:700; color:var(--pm-text);">{{ printer().businessName }}</h3>
            <p style="font-size:0.82rem; color:var(--pm-text-muted); margin-top:0.2rem;">{{ printer().location }}</p>
          </div>
          <app-printer-badge [rank]="printer().rank" />
        </div>

        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; text-align:center;">
          @for (stat of [
            { val: printer().rating, label: 'rating' },
            { val: printer().fulfillmentRate + '%', label: 'fulfilled' },
            { val: printer().deliveryDays + 'd', label: 'lead time' }
          ]; track stat.label) {
            <div style="background:var(--pm-surface-alt); border:1px solid var(--pm-border); border-radius:10px; padding:0.625rem 0.5rem;">
              <div style="font-weight:700; font-size:0.95rem; color:var(--pm-text);">{{ stat.val }}</div>
              <div style="font-size:0.68rem; color:var(--pm-text-muted); margin-top:0.15rem;">{{ stat.label }}</div>
            </div>
          }
        </div>

        @if (note()) {
          <p style="font-size:0.8rem; color:var(--pm-text-muted); line-height:1.55; background:var(--pm-surface-alt); border:1px solid var(--pm-border); border-radius:10px; padding:0.625rem 0.75rem;">
            {{ note() }}
          </p>
        }

        <div style="border-top:1px solid var(--pm-border); padding-top:0.875rem; display:flex; align-items:center; justify-content:space-between; gap:0.75rem;">
          @if (price() !== null) {
            <div>
              <p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--pm-text-muted);">Total here</p>
              <p class="pm-heading" style="font-size:1.05rem; font-weight:800; color:var(--pm-text);">{{ price() }} TND</p>
            </div>
          } @else {
            <p style="font-size:0.82rem; color:var(--pm-text-muted);">{{ printer().reviews }} reviews</p>
          }
          <button
            type="button"
            class="pm-btn"
            [class.pm-btn-primary]="!isSelected()"
            [class.pm-btn-secondary]="isSelected()"
            style="font-size:0.85rem;"
            (click)="selected.emit(printer().id)"
          >{{ isSelected() ? '✓ Selected' : 'Select →' }}</button>
        </div>
      </div>
    </article>
  `,
})
export class PrinterCardComponent {
  readonly printer = input.required<PrinterPartner>();
  /** Total price the buyer would pay at this printer for the whole order. */
  readonly price = input<number | null>(null);
  /** This printer's own description(s) for the selected product(s). */
  readonly note = input<string>('');
  readonly isSelected = input<boolean>(false);
  readonly selected = output<number>();
  readonly activeIndex = signal(0);
  readonly currentImage = computed(() => this.printer().images[this.activeIndex()] ?? this.printer().images[0] ?? '/placeholder-image.svg');
}
