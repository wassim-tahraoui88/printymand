import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { orderStatusClass } from '../models/order-status';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

@Component({
  selector: 'app-order-tracking-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking.html',
})
export class OrderTrackingPageComponent {
  private readonly store = inject(PlatformStoreService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = signal<string>('');

  /**
   * The order, but only for someone entitled to it — its buyer, a printer with
   * a line on it, or an admin. Order references are guessable, so an unrelated
   * signed-in user must get the "not found" branch rather than another
   * customer's address and basket.
   */
  readonly order = computed(() => {
    const user = this.auth.user();
    if (!user || !this.store.canViewOrder(this.orderId(), user.id)) return undefined;
    return this.store.getOrderById(this.orderId());
  });
  readonly stage = computed(() => (this.order() ? this.store.getOrderStatus(this.order()!) : ''));
  readonly timeline = computed(() => (this.order() ? this.store.buildOrderTimeline(this.order()!) : []));

  /** Paying and cancelling belong to the buyer alone, not to a viewing printer. */
  private readonly isBuyer = computed(() => {
    const o = this.order();
    return !!o && o.userId === this.auth.user()?.id;
  });
  readonly canPay = computed(() => {
    const o = this.order();
    return !!o && this.isBuyer() && o.requestStatus === 'ACCEPTED' && o.paymentStatus !== 'paid';
  });
  // Matches the store rule: a request can still be withdrawn after the printer
  // accepted it, right up until it is paid (which is what /cart offers too).
  readonly canCancel = computed(() => {
    const o = this.order();
    return (
      !!o &&
      this.isBuyer() &&
      o.paymentStatus !== 'paid' &&
      (o.requestStatus === 'REQUESTED' || o.requestStatus === 'ACCEPTED')
    );
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
    const user = this.auth.user();
    if (!o || !user) return;
    this.busy.set(true);
    this.error.set('');
    const result = await this.store.payForOrder(o.id, user.id);
    this.busy.set(false);
    if (!result.success) this.error.set(result.error ?? 'Payment could not be completed.');
  }

  cancel(): void {
    const o = this.order();
    const user = this.auth.user();
    if (!o || !user) return;
    const result = this.store.cancelOrderRequest(o.id, user.id);
    if (!result.success) this.error.set(result.error ?? 'Could not cancel the request.');
  }

  readonly statusClass = orderStatusClass;
}
