import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <section class="pm-card p-5">
      <p class="text-sm text-slate-500">{{ label() }}</p>
      <div class="mt-3 flex items-end justify-between gap-3">
        <p class="text-3xl font-semibold text-slate-950">{{ value() }}</p>
        @if (hint()) {
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ hint() }}</span>
        }
      </div>
    </section>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input('');
}
