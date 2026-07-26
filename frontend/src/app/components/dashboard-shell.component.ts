import { Component, input } from '@angular/core';

/**
 * Page shell for the standalone profile pages.
 *
 * Uses the editorial vocabulary (`page`, `desk-header`, `h-title`) so these
 * pages read the same as the dashboards and the rest of the site.
 */
@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  template: `
    <section class="page" style="padding-block:38px 28px;">
      <div class="desk-header">
        <div style="flex:1; min-width:0;">
          <p class="kicker kicker-clay" style="margin-bottom:10px;">{{ eyebrow() }}</p>
          <h1 class="h-title">{{ title() }}</h1>
          @if (description()) {
            <p class="serif-italic" style="font-size:15px; line-height:1.6; color:var(--pm-text-muted); max-width:60ch; margin:12px 0 0;">
              {{ description() }}
            </p>
          }
        </div>
        <ng-content select="[dashboard-actions]" />
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
