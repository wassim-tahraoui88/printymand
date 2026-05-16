import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-order-tracking-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking.html',
})
export class OrderTrackingPageComponent {
  private readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = signal<string>('');
  readonly order = computed(() => this.workflow.getOrderById(this.orderId()));
  readonly stage = computed(() => (this.order() ? this.workflow.getOrderStatus(this.order()!) : ''));
  readonly timeline = computed(() => (this.order() ? this.workflow.buildOrderTimeline(this.order()!) : []));

  readonly canPay = computed(() => {
    const o = this.order();
    return !!o && o.requestStatus === 'ACCEPTED' && o.paymentStatus !== 'paid';
  });
  readonly canCancel = computed(() => {
    const o = this.order();
    return !!o && o.requestStatus === 'REQUESTED';
  });

  readonly busy = signal(false);
  readonly error = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.orderId.set(params.get('orderId') ?? '');
    });
  }

  async pay(): Promise<void> {
    const o = this.order();
    if (!o) return;
    this.busy.set(true);
    this.error.set('');
    const result = await this.workflow.payForOrder(o.id);
    this.busy.set(false);
    if (!result.success) this.error.set(result.error ?? 'Payment could not be completed.');
  }

  cancel(): void {
    const o = this.order();
    const user = this.auth.user();
    if (!o || !user) return;
    const result = this.workflow.cancelOrderRequest(o.id, user.id);
    if (!result.success) this.error.set(result.error ?? 'Could not cancel the request.');
  }

  statusClass(status: string): string {
    return `pm-status pm-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  }
}
