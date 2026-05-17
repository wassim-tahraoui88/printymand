import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * Dependency-free SVG donut chart + legend. Branding-coherent (uses pm- text
 * vars). Used by the designer and printer analytics dashboards.
 */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
      <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" [style.width.px]="size" [style.height.px]="size" role="img" [attr.aria-label]="title()">
        @if (total() > 0) {
          @for (seg of segments(); track seg.label) {
            <circle
              [attr.cx]="size / 2"
              [attr.cy]="size / 2"
              [attr.r]="radius"
              fill="none"
              [attr.stroke]="seg.color"
              [attr.stroke-width]="stroke"
              [attr.stroke-dasharray]="seg.dash + ' ' + (circumference - seg.dash)"
              [attr.stroke-dashoffset]="seg.offset"
              [attr.transform]="'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'"
            />
          }
          <text [attr.x]="size / 2" [attr.y]="size / 2 - 2" text-anchor="middle" style="font-size:1.1rem; font-weight:800; fill:var(--pm-text);">{{ total() }}</text>
          <text [attr.x]="size / 2" [attr.y]="size / 2 + 16" text-anchor="middle" style="font-size:0.62rem; fill:var(--pm-text-muted); text-transform:uppercase; letter-spacing:0.08em;">{{ unit() }}</text>
        } @else {
          <circle [attr.cx]="size / 2" [attr.cy]="size / 2" [attr.r]="radius" fill="none" stroke="var(--pm-border)" [attr.stroke-width]="stroke" />
          <text [attr.x]="size / 2" [attr.y]="size / 2 + 4" text-anchor="middle" style="font-size:0.7rem; fill:var(--pm-text-muted);">No data</text>
        }
      </svg>

      <div style="display:grid; gap:0.4rem; min-width:140px;">
        @for (seg of segments(); track seg.label) {
          <div style="display:flex; align-items:center; gap:0.5rem; font-size:var(--pm-text-sm);">
            <span [style.background]="seg.color" style="width:0.7rem; height:0.7rem; border-radius:3px; flex-shrink:0;"></span>
            <span style="color:var(--pm-text); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ seg.label }}</span>
            <span style="color:var(--pm-text-muted); font-weight:700;">{{ seg.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class DonutChartComponent {
  readonly data = input.required<DonutSlice[]>();
  readonly title = input<string>('chart');
  readonly unit = input<string>('total');

  readonly size = 150;
  readonly stroke = 22;
  get radius(): number {
    return (this.size - this.stroke) / 2;
  }
  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  readonly total = computed(() => this.data().reduce((s, d) => s + d.value, 0));

  readonly segments = computed(() => {
    const total = this.total();
    let acc = 0;
    return this.data().map((d) => {
      const frac = total > 0 ? d.value / total : 0;
      const dash = frac * this.circumference;
      const offset = -acc * this.circumference;
      acc += frac;
      return { ...d, dash, offset };
    });
  });
}
