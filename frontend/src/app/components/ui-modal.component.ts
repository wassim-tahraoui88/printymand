import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div style="position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.45); padding:1rem; backdrop-filter:blur(4px);" (click)="closed.emit()">
        <section class="pm-modal" (click)="$event.stopPropagation()">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; border-bottom:1px solid var(--pm-border); padding-bottom:1rem; margin-bottom:1.25rem;">
            <div>
              <h2 class="display" style="font-size:22px;">{{ title() }}</h2>
              @if (description()) {
                <p style="margin-top:0.25rem; font-size:0.85rem; color:var(--pm-text-muted);">{{ description() }}</p>
              }
            </div>
            <button type="button" class="pm-icon-btn" style="flex-shrink:0;" (click)="closed.emit()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <ng-content />
        </section>
      </div>
    }
  `,
})
export class UiModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly closed = output<void>();
}
