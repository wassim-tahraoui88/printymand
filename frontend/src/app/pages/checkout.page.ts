import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { Order } from '../models/types';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

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
  private readonly workflow = inject(WorkflowService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.auth.user());
  readonly orders = computed<Order[]>(() =>
    this.user() ? this.workflow.awaitingPaymentOrdersForUser(this.user()!.id) : [],
  );
  readonly defaultAddress = computed(() => this.user()?.customerProfile?.savedAddresses.find((a) => a.isDefault));

  readonly paymentMethod = signal<'paymee' | 'd17' | 'card' | 'cash'>('d17');
  readonly error = signal('');
  readonly busy = signal<number | string | null>(null);

  readonly recipientName = signal('');
  readonly addressLine = signal('');
  readonly city = signal('');
  readonly governorate = signal('');
  readonly phone = signal('');

  readonly governorates = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
    'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia',
    'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
    'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
  ] as const;

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
    if (!this.user()) return;
    this.busy.set(order.id);
    this.error.set('');
    const shipping = this.shippingAddress().trim();
    if (shipping) this.workflow.setOrderShippingAddress(order.id, shipping);
    this.workflow.setOrderPaymentMethod(order.id, this.paymentMethod());
    const result = await this.workflow.payForOrder(order.id);
    this.busy.set(null);
    if (!result.success) {
      this.error.set(result.error ?? 'Payment could not be completed.');
      return;
    }
    this.router.navigateByUrl(`/tracking/${order.id}`);
  }
}
