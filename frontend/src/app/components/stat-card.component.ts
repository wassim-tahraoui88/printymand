import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div style="background:var(--pm-surface); border:1px solid var(--pm-border); border-radius:var(--pm-radius-lg); padding:1.25rem; box-shadow:var(--pm-shadow-sm); transition:box-shadow 200ms ease, transform 200ms ease;">
      <p class="pm-kicker">{{ label() }}</p>
      <div style="margin-top:0.75rem; display:flex; align-items:flex-end; justify-content:space-between; gap:0.75rem;">
        <p class="pm-heading" style="font-size:1.8rem; font-weight:800; color:var(--pm-text); letter-spacing:-0.02em; line-height:1;">{{ value() }}</p>
        @if (hint()) {
          <span style="border-radius:999px; background:var(--pm-surface-alt); border:1px solid var(--pm-border); padding:0.25rem 0.6rem; font-size:0.7rem; font-weight:600; color:var(--pm-text-muted); white-space:nowrap;">{{ hint() }}</span>
        }
      </div>
    </div>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input('');
}
