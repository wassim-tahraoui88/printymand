import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  template: `
    <section class="pm-page">
      <div class="pm-hero" style="padding:2rem 2.5rem;">
        <div style="position:relative; z-index:1;">
          <p class="pm-kicker mb-3">{{ eyebrow() }}</p>
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 class="pm-heading font-extrabold text-white" style="font-size:clamp(1.8rem,4vw,2.8rem); letter-spacing:-0.02em; line-height:1.1;">{{ title() }}</h1>
              @if (description()) {
                <p style="max-width:600px; font-size:0.9rem; line-height:1.7; color:rgba(255,255,255,0.65); margin-top:0.6rem;">{{ description() }}</p>
              }
            </div>
            <ng-content select="[dashboard-actions]" />
          </div>
        </div>
      </div>
      <ng-content />
    </section>
  `,
})
export class DashboardShellComponent {
  readonly eyebrow = input('Workspace');
  readonly title = input.required<string>();
  readonly description = input('');
}
