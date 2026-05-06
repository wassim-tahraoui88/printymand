import { Component, computed, input } from '@angular/core';
import type { DesignerRank, PrinterRank } from '../models/types';

@Component({
  selector: 'app-designer-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold" [class]="classes()">
      {{ rank() }}
    </span>
  `,
})
export class DesignerBadgeComponent {
  readonly rank = input.required<DesignerRank>();
  readonly classes = computed(() => {
    const map: Record<DesignerRank, string> = {
      Novice: 'border-slate-200 bg-slate-50 text-slate-700',
      Rising: 'border-sky-200 bg-sky-50 text-sky-700',
      Artisan: 'border-amber-200 bg-amber-50 text-amber-700',
      Elite: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    };
    return map[this.rank()];
  });
}

@Component({
  selector: 'app-printer-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold" [class]="classes()">
      {{ rank() }}
    </span>
  `,
})
export class PrinterBadgeComponent {
  readonly rank = input.required<PrinterRank>();
  readonly classes = computed(() => {
    const map: Record<PrinterRank, string> = {
      Verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      Gold: 'border-amber-200 bg-amber-50 text-amber-700',
      Premium: 'border-violet-200 bg-violet-50 text-violet-700',
    };
    return map[this.rank()];
  });
}
