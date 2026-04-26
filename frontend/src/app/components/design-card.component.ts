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
      ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      ARCHIVED: 'border-amber-200 bg-amber-50 text-amber-700',
      REMOVED: 'border-red-200 bg-red-50 text-red-700',
    };
    return map[this.design().status];
  });
}
