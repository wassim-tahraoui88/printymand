import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
})
export class CheckoutPageComponent {
  private readonly auth = inject(AuthService);
  private readonly workflow = inject(WorkflowService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.auth.user());
  readonly cart = computed(() => (this.user() ? this.workflow.cartForUser(this.user()!.id) : { items: [], total: 0 }));
  readonly defaultAddress = computed(() => this.user()?.customerProfile?.savedAddresses.find((address) => address.isDefault));
  readonly paymentMethod = signal<'cash' | 'd17' | 'card'>('card');
  readonly shippingAddress = signal('');
  readonly error = signal('');
  readonly busy = signal(false);

  constructor() {
    const address = this.defaultAddress();
    if (address) {
      this.shippingAddress.set([address.line1, address.city, address.postalCode].filter(Boolean).join(', '));
    } else if (this.user()?.address) {
      this.shippingAddress.set(this.user()!.address);
    }
  }

  removeItem(itemId: number): void {
    if (!this.user()) return;
    this.workflow.removeCartLine(this.user()!.id, itemId);
  }

  async placeOrder(): Promise<void> {
    const user = this.user();
    if (!user) return;
    if (!this.cart().items.length) {
      this.error.set('Your cart is empty.');
      return;
    }

    this.busy.set(true);
    this.error.set('');
    const order = await this.workflow.placeOrderForUser(user.id, {
      paymentMethod: this.paymentMethod(),
      shippingAddress: this.shippingAddress().trim(),
    });

    if (!order) {
      this.busy.set(false);
      this.error.set('The order could not be created.');
      return;
    }

    const paymentUrl = await this.workflow.initiatePayment(order.id);
    this.busy.set(false);

    if (paymentUrl.startsWith('/')) {
      this.router.navigateByUrl(paymentUrl);
      return;
    }

    window.location.assign(paymentUrl);
  }
}
