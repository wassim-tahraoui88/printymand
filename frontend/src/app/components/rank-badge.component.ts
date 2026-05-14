import { Component, computed, input } from '@angular/core';
import type { DesignerRank, PrinterRank } from '../models/types';

@Component({
  selector: 'app-designer-badge',
  standalone: true,
  template: `
    <span style="display:inline-flex; align-items:center; border-radius:999px; border:1px solid; padding:0.2rem 0.55rem; font-size:0.68rem; font-weight:700; letter-spacing:0.04em; white-space:nowrap;"
      [style.background]="bg()" [style.borderColor]="border()" [style.color]="color()">
      {{ rank() }}
    </span>
  `,
})
export class DesignerBadgeComponent {
  readonly rank = input.required<DesignerRank>();
  readonly bg = computed(() => ({ Novice: 'var(--pm-surface-alt)', Rising: 'var(--pm-accent-soft)', Artisan: 'var(--pm-secondary-soft)', Elite: 'var(--pm-primary-soft)' })[this.rank()]);
  readonly border = computed(() => ({ Novice: 'var(--pm-border-strong)', Rising: 'rgba(29,78,216,0.25)', Artisan: 'rgba(232,158,28,0.3)', Elite: 'rgba(199,74,43,0.3)' })[this.rank()]);
  readonly color = computed(() => ({ Novice: 'var(--pm-text-muted)', Rising: 'var(--pm-accent)', Artisan: 'var(--pm-secondary)', Elite: 'var(--pm-primary)' })[this.rank()]);
}

@Component({
  selector: 'app-printer-badge',
  standalone: true,
  template: `
    <span style="display:inline-flex; align-items:center; border-radius:999px; border:1px solid; padding:0.2rem 0.55rem; font-size:0.68rem; font-weight:700; letter-spacing:0.04em; white-space:nowrap;"
      [style.background]="bg()" [style.borderColor]="border()" [style.color]="color()">
      {{ rank() }}
    </span>
  `,
})
export class PrinterBadgeComponent {
  readonly rank = input.required<PrinterRank>();
  readonly bg = computed(() => ({ Verified: 'var(--pm-success-soft)', Gold: 'var(--pm-secondary-soft)', Premium: 'var(--pm-primary-soft)' })[this.rank()]);
  readonly border = computed(() => ({ Verified: 'rgba(21,128,61,0.25)', Gold: 'rgba(232,158,28,0.3)', Premium: 'rgba(199,74,43,0.3)' })[this.rank()]);
  readonly color = computed(() => ({ Verified: 'var(--pm-success)', Gold: 'var(--pm-secondary)', Premium: 'var(--pm-primary)' })[this.rank()]);
}
