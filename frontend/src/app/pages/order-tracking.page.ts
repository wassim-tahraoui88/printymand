import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-order-tracking-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking.html',
})
export class OrderTrackingPageComponent {
  private readonly workflow = inject(WorkflowService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = signal<string>('');
  readonly order = computed(() => this.workflow.getOrderById(this.orderId()));
  readonly timeline = computed(() => (this.order() ? this.workflow.buildOrderTimeline(this.order()!) : []));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.orderId.set(params.get('orderId') ?? '');
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params.get('payment') === 'paid' && this.orderId()) {
        this.workflow.markPaymentPaid(this.orderId());
      }
    });
  }

  statusClass(status: string): string {
    return `pm-status pm-status-${status.toLowerCase()}`;
  }
}
