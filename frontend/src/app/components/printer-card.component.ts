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
    <article class="plate" [style.outline]="isSelected() ? '2px solid var(--pm-clay)' : null" [style.outline-offset]="'3px'">
      <div class="plate-image" style="aspect-ratio:16/10;">
        <app-image-with-fallback
          [src]="currentImage()"
          [alt]="printer().businessName"
          [imgClass]="'w-full h-full object-cover'"
        />
        <span class="plate-no">{{ printer().location }}</span>
      </div>

      <div style="display:grid; gap:14px; padding-top:14px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
          <h3 style="font-family:var(--pm-font-display); font-weight:700; font-size:18px; letter-spacing:-0.02em; color:var(--pm-ink); margin:0;">
            {{ printer().businessName }}
          </h3>
          <app-printer-badge [rank]="printer().rank" />
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); border-top:1px solid var(--pm-rule); border-bottom:1px solid var(--pm-rule);">
          @for (stat of stats(); track stat.label) {
            <div style="padding:10px 6px; text-align:center; border-right:1px solid var(--pm-rule);">
              <div style="font-family:var(--pm-font-display); font-weight:800; font-size:16px; color:var(--pm-ink);">{{ stat.val }}</div>
              <div class="serif-italic" style="font-size:11px; color:var(--pm-text-muted);">{{ stat.label }}</div>
            </div>
          }
        </div>

        @if (note()) {
          <p class="serif-italic" style="font-size:13px; color:var(--pm-text-muted); line-height:1.55; margin:0;">
            {{ note() }}
          </p>
        }

        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
          @if (price() !== null) {
            <div>
              <div class="kicker" style="font-size:10px; color:var(--pm-text-muted);">Total here</div>
              <div style="font-family:var(--pm-font-display); font-weight:800; font-size:20px; color:var(--pm-ink);">{{ price() }} TND</div>
            </div>
          } @else {
            <p class="serif-italic" style="font-size:13px; color:var(--pm-text-muted); margin:0;">{{ printer().reviews }} reviews</p>
          }
          <button
            type="button"
            class="btn"
            [class.btn-clay]="!isSelected()"
            [class.btn-ghost]="isSelected()"
            style="font-size:11px; padding:10px 16px;"
            (click)="selected.emit(printer().id)"
          >{{ isSelected() ? '✓ Selected' : 'Select' }} <span class="ar">→</span></button>
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
  readonly currentImage = computed(
    () => this.printer().images.at(this.activeIndex()) ?? this.printer().images.at(0) ?? '/placeholder-image.svg',
  );

  readonly stats = computed(() => [
    { val: String(this.printer().rating), label: 'rating' },
    { val: `${this.printer().fulfillmentRate}%`, label: 'fulfilled' },
    { val: `${this.printer().deliveryDays}d`, label: 'lead time' },
  ]);
}
