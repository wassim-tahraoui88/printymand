import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-block',
  standalone: true,
  template: `<div class="animate-pulse rounded-xl bg-slate-200/80" [style.height]="height()" [style.width]="width()"></div>`,
})
export class SkeletonBlockComponent {
  readonly height = input('1rem');
  readonly width = input('100%');
}
