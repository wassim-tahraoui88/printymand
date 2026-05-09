import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" (click)="closed.emit()">
        <section class="pm-modal" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 class="text-xl font-semibold text-slate-950">{{ title() }}</h2>
              @if (description()) {
                <p class="mt-1 text-sm text-slate-500">{{ description() }}</p>
              }
            </div>
            <button type="button" class="pm-icon-btn" (click)="closed.emit()">×</button>
          </div>
          <div class="mt-5">
            <ng-content />
          </div>
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
