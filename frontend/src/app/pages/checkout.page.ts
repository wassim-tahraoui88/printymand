import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { Order, PaymentMethod } from '../models/types';
import { TUNISIA_GOVERNORATES } from '../models/tunisia';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

/**
 * Cart / payment page.
 *
 * New flow: the order request is created at printer selection. The customer
 * comes here ONLY after a printer has accepted, to choose a payment method and
 * pay. The cart therefore lists accepted-but-unpaid orders.
 */
@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
})
export class CheckoutPageComponent {
  private readonly auth = inject(AuthService);
  private readonly store = inject(PlatformStoreService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.auth.user());
  readonly orders = computed<Order[]>(() =>
    this.user() ? this.store.awaitingPaymentOrdersForUser(this.user()!.id) : [],
  );
  readonly defaultAddress = computed(() => this.user()?.customerProfile?.savedAddresses.find((a) => a.isDefault));

  /**
   * Payment method PER ORDER. A single shared selector meant paying one order
   * silently carried its choice to the next one in the list.
   *
   * Each order starts on the method it was requested with, which the store seeds
   * from the buyer's default saved preference.
   */
  private readonly methodOverrides = signal<Record<string, PaymentMethod>>({});
  readonly error = signal('');
  readonly busy = signal<number | string | null>(null);

  /** The buyer's saved payment preferences, surfaced as the recommended tiles. */
  readonly preferences = computed(() =>
    (this.user()?.customerProfile?.paymentPreferences ?? []).filter((preference) => preference.enabled),
  );

  paymentMethod(order: Order): PaymentMethod {
    return this.methodOverrides()[String(order.id)] ?? order.paymentMethod;
  }

  setPaymentMethod(order: Order, method: PaymentMethod): void {
    this.methodOverrides.set({ ...this.methodOverrides(), [String(order.id)]: method });
  }

  /** Label from the buyer's saved preference for a method, when they have one. */
  preferenceLabel(method: PaymentMethod): string | null {
    return this.preferences().find((preference) => preference.provider === method)?.label ?? null;
  }

  readonly recipientName = signal('');
  readonly addressLine = signal('');
  readonly city = signal('');
  readonly governorate = signal('');
  readonly phone = signal('');

  readonly governorates = TUNISIA_GOVERNORATES;

  /** Every method the platform accepts — saved preferences are highlighted among them. */
  readonly paymentOptions: { value: PaymentMethod; mark: string; name: string; desc: string }[] = [
    { value: 'd17', mark: 'D17', name: 'D17 mobile wallet', desc: 'Pay instantly from the D17 app.' },
    { value: 'card', mark: 'CARD', name: 'Visa or MasterCard', desc: 'Card processed via Paymee, in TND.' },
    { value: 'paymee', mark: 'PM', name: 'Paymee', desc: 'Tunisian gateway, secure tokenized payment.' },
    { value: 'cash', mark: 'COD', name: 'Cash on delivery', desc: 'Pay when the courier hands it over.' },
  ];

  readonly shippingAddress = computed(() =>
    [this.recipientName(), this.addressLine(), this.city(), this.governorate(), this.phone()]
      .filter(Boolean)
      .join(', '),
  );

  constructor() {
    const address = this.defaultAddress();
    if (address) {
      this.recipientName.set(address.recipient);
      this.addressLine.set(address.line1);
      this.city.set(address.city);
      this.governorate.set(address.governorate);
      this.phone.set(address.phone);
    } else if (this.user()?.address) {
      this.addressLine.set(this.user()!.address);
    }
  }

  /** Pay an accepted order; the printer is then notified to start work. */
  async pay(order: Order): Promise<void> {
    const user = this.user();
    if (!user) return;
    this.busy.set(order.id);
    this.error.set('');
    const shipping = this.shippingAddress().trim();
    if (shipping) this.store.setOrderShippingAddress(order.id, shipping);
    this.store.setOrderPaymentMethod(order.id, this.paymentMethod(order));
    const result = await this.store.payForOrder(order.id, user.id);
    this.busy.set(null);
    if (!result.success) {
      this.error.set(result.error ?? 'Payment could not be completed.');
      return;
    }
    this.router.navigateByUrl(`/tracking/${order.id}`);
  }

  /** Buyer removes an accepted-but-unpaid order; the printer sees it canceled. */
  remove(order: Order): void {
    const user = this.user();
    if (!user) return;
    this.error.set('');
    const result = this.store.cancelOrderRequest(order.id, user.id);
    if (!result.success) {
      this.error.set(result.error ?? 'Could not remove this order.');
    }
  }
}
