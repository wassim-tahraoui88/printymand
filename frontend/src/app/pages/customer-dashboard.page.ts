import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardSidebarComponent, DashboardNavSection } from '../components/dashboard-sidebar.component';
import type { PaymentMethod } from '../models/types';
import { TUNISIA_GOVERNORATES } from '../models/tunisia';
import { isInFlight, orderStatusClass } from '../models/order-status';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

@Component({
  selector: 'app-customer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardSidebarComponent],
  templateUrl: './customer-dashboard.html',
})
export class CustomerDashboardPageComponent {
  private readonly auth = inject(AuthService);
  readonly store = inject(PlatformStoreService);

  readonly activeTab = signal('overview');
  readonly sidebarOpen = signal(false);

  readonly nav: DashboardNavSection[] = [
    {
      items: [
        { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'orders',   label: 'My Orders',  icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { id: 'settings', label: 'Settings',   icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      ],
    },
  ];

  readonly user = computed(() => this.auth.user());
  readonly orders = computed(() => (this.user() ? this.store.currentUserOrders() : []));
  readonly reviews = computed(() => this.store.reviews().filter((r) => r.customerId === this.user()?.id));
  readonly addresses = computed(() => this.user()?.customerProfile?.savedAddresses ?? []);
  readonly paymentPreferences = computed(() => this.user()?.customerProfile?.paymentPreferences ?? []);

  readonly stats = computed(() => {
    const orders = this.orders();
    const delivered = orders.filter((o) => this.store.getOrderStatus(o) === 'Delivered').length;
    const inFlight = orders.filter((o) => isInFlight(this.store.getOrderStatus(o))).length;
    return {
      orders: orders.length,
      delivered,
      inFlight,
      spend: orders.reduce((sum, o) => sum + o.total, 0),
    };
  });

  readonly reviewOrderId = signal<number | string | null>(null);
  readonly reviewError = signal('');
  readonly reviewOrder = computed(() => {
    const id = this.reviewOrderId();
    return id ? this.store.getOrderById(id) : undefined;
  });

  /**
   * Every design and pressroom on the order, not just the first line — an order
   * carrying two designs must be reviewable for both.
   */
  readonly reviewTargets = computed(() => {
    const id = this.reviewOrderId();
    return id ? this.store.reviewTargetsForOrder(id) : { designs: [], printers: [] };
  });

  /** Draft rating/comment per target, keyed `design-<id>` / `printer-<id>`. */
  private readonly drafts = signal<Record<string, { rating: number; comment: string }>>({});

  private draftKey(target: 'design' | 'printer', id: number): string {
    return `${target}-${id}`;
  }

  draftFor(target: 'design' | 'printer', id: number): { rating: number; comment: string } {
    return this.drafts()[this.draftKey(target, id)] ?? { rating: 5, comment: '' };
  }

  setDraft(target: 'design' | 'printer', id: number, patch: Partial<{ rating: number; comment: string }>): void {
    const key = this.draftKey(target, id);
    this.drafts.set({ ...this.drafts(), [key]: { ...this.draftFor(target, id), ...patch } });
  }

  hasReview(orderId: number | string, target: 'design' | 'printer', targetId: number): boolean {
    const user = this.user();
    return !!user && this.store.hasReviewed(orderId, user.id, target, targetId);
  }

  /** How many designs/pressrooms on this order still need a rating. */
  pendingReviewCount(orderId: number | string): number {
    const { designs, printers } = this.store.reviewTargetsForOrder(orderId);
    return (
      designs.filter((design) => !this.hasReview(orderId, 'design', design.id)).length +
      printers.filter((printer) => !this.hasReview(orderId, 'printer', printer.id)).length
    );
  }

  /** Nothing left to rate on this order — the modal shows a done state instead. */
  readonly allReviewed = computed(() => {
    const id = this.reviewOrderId();
    if (!id) return false;
    const { designs, printers } = this.reviewTargets();
    return (
      designs.every((design) => this.hasReview(id, 'design', design.id)) &&
      printers.every((printer) => this.hasReview(id, 'printer', printer.id))
    );
  });

  readonly addressForm = signal({
    id: undefined as number | undefined,
    label: '',
    recipient: '',
    line1: '',
    city: 'Tunis',
    governorate: 'Tunis',
    postalCode: '1000',
    phone: '',
    isDefault: false,
  });

  readonly paymentForm = signal({
    id: '',
    label: '',
    // Every method checkout accepts — Paymee was payable but not savable.
    provider: 'card' as PaymentMethod,
    details: '',
    isDefault: false,
    enabled: true,
  });

  readonly governorates = TUNISIA_GOVERNORATES;

  readonly statusClass = orderStatusClass;

  openReviewModal(orderId: number | string): void {
    this.reviewOrderId.set(orderId);
    this.drafts.set({});
    this.reviewError.set('');
  }

  closeReviewModal(): void {
    this.reviewOrderId.set(null);
  }

  /** Spec: rate EVERY design on the order, and every pressroom that made it. */
  async submitReview(): Promise<void> {
    const user = this.user();
    const order = this.reviewOrder();
    if (!user || !order) return;
    this.reviewError.set('');

    const { designs, printers } = this.reviewTargets();

    for (const design of designs) {
      if (this.hasReview(order.id, 'design', design.id)) continue;
      const draft = this.draftFor('design', design.id);
      const res = await this.store.submitReview(order.id, user.id, {
        target: 'design',
        designId: design.id,
        rating: draft.rating,
        comment: draft.comment,
      });
      if (!res.success) {
        this.reviewError.set(res.error ?? `Could not submit the review for "${design.title}".`);
        return;
      }
    }

    for (const printer of printers) {
      if (this.hasReview(order.id, 'printer', printer.id)) continue;
      const draft = this.draftFor('printer', printer.id);
      const res = await this.store.submitReview(order.id, user.id, {
        target: 'printer',
        printerId: printer.id,
        rating: draft.rating,
        comment: draft.comment,
      });
      if (!res.success) {
        this.reviewError.set(res.error ?? `Could not submit the review for ${printer.businessName}.`);
        return;
      }
    }
    this.closeReviewModal();
  }

  saveAddress(): void {
    this.auth.saveAddress(this.addressForm());
    this.addressForm.set({ id: undefined, label: '', recipient: '', line1: '', city: 'Tunis', governorate: 'Tunis', postalCode: '1000', phone: '', isDefault: false });
  }

  editAddress(addressId: number): void {
    const address = this.addresses().find((a) => a.id === addressId);
    if (!address) return;
    this.addressForm.set({ ...address });
  }

  removeAddress(addressId: number): void {
    this.auth.removeAddress(addressId);
  }

  savePaymentPreference(): void {
    this.auth.savePaymentPreference(this.paymentForm());
    this.paymentForm.set({ id: '', label: '', provider: 'card', details: '', isDefault: false, enabled: true });
  }

  updateProfileField(field: 'name' | 'email' | 'address', value: string): void {
    this.auth.updateProfile({ [field]: value });
  }
}
