import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  template: `
    <section class="pm-page">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">{{ eyebrow() }}</p>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-2">
            <h1 class="text-3xl font-semibold tracking-tight text-slate-950">{{ title() }}</h1>
            <p class="text-sm leading-6 text-slate-600">{{ description() }}</p>
          </div>
          <ng-content select="[dashboard-actions]" />
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
