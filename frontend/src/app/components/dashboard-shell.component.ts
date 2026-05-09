import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  template: `
    <section class="pm-page">
      <div class="pm-hero">
        <div class="space-y-2">
          <p class="pm-kicker">{{ eyebrow() }}</p>
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="space-y-3">
              <h1 class="pm-heading text-4xl font-semibold tracking-tight text-white">{{ title() }}</h1>
              <p class="max-w-3xl text-sm leading-7 text-slate-200">{{ description() }}</p>
            </div>
            <ng-content select="[dashboard-actions]" />
          </div>
        </div>
      </div>
      <div class="space-y-2">
        <p class="text-sm text-slate-400">Workspace insights, controls, and role-specific tasks live below.</p>
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
