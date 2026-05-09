import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import type { Design } from '../models/types';
import { ImageWithFallbackComponent } from './image-with-fallback.component';
import { DesignerBadgeComponent } from './rank-badge.component';

@Component({
  selector: 'app-design-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageWithFallbackComponent, DesignerBadgeComponent],
  templateUrl: './design-card.html',
})
export class DesignCardComponent {
  readonly design = input.required<Design>();
  readonly preferredProductId = input<number | null>(null);
  readonly statusTone = computed(() => {
    const map: Record<Design['status'], string> = {
      ACTIVE: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
      ARCHIVED: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
      REMOVED: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    };
    return map[this.design().status];
  });
}
