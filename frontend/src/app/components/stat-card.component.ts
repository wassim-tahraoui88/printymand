import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <section class="pm-card p-5">
      <p class="pm-kicker">{{ label() }}</p>
      <div class="mt-3 flex items-end justify-between gap-3">
        <p class="pm-heading text-3xl font-semibold text-white">{{ value() }}</p>
        @if (hint()) {
          <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">{{ hint() }}</span>
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
