import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardSidebarComponent, DashboardNavSection } from '../components/dashboard-sidebar.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-customer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardSidebarComponent],
  templateUrl: './customer-dashboard.html',
})
export class CustomerDashboardPageComponent {
  private readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);

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
  readonly orders = computed(() => (this.user() ? this.workflow.currentOrders() : []));
  readonly reviews = computed(() => this.workflow.reviews().filter((r) => r.customerId === this.user()?.id));
  readonly addresses = computed(() => this.user()?.customerProfile?.savedAddresses ?? []);
  readonly paymentPreferences = computed(() => this.user()?.customerProfile?.paymentPreferences ?? []);

  readonly stats = computed(() => {
    const orders = this.orders();
    const delivered = orders.filter((o) => this.workflow.getOrderStatus(o) === 'Delivered').length;
    const inFlight = orders.filter((o) => ['Pending', 'Accepted', 'Printing', 'Shipped'].includes(this.workflow.getOrderStatus(o))).length;
    return {
      orders: orders.length,
      delivered,
      inFlight,
      spend: orders.reduce((sum, o) => sum + o.total, 0),
    };
  });

  readonly reviewOrderId = signal<number | string | null>(null);
  readonly reviewRating = signal(5);
  readonly reviewComment = signal('');
  readonly reviewPrinterRating = signal(5);
  readonly reviewPrinterComment = signal('');
  readonly reviewError = signal('');
  readonly reviewOrder = computed(() => {
    const id = this.reviewOrderId();
    return id ? this.workflow.getOrderById(id) : undefined;
  });
  hasReview(orderId: number | string, target: 'design' | 'printer'): boolean {
    return this.reviews().some((r) => r.orderId === orderId && r.target === target);
  }

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
    provider: 'card' as 'card' | 'd17' | 'cash',
    details: '',
    isDefault: false,
    enabled: true,
  });

  readonly governorates = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
    'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia',
    'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
    'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
  ] as const;

  statusClass(status: string): string {
    return `pm-status pm-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  openReviewModal(orderId: number | string): void {
    this.reviewOrderId.set(orderId);
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.reviewPrinterRating.set(5);
    this.reviewPrinterComment.set('');
    this.reviewError.set('');
  }

  closeReviewModal(): void {
    this.reviewOrderId.set(null);
  }

  /** Spec: rate BOTH the design and the printer after delivery. */
  async submitReview(): Promise<void> {
    const user = this.user();
    const order = this.reviewOrder();
    if (!user || !order) return;
    const firstLine = order.lines[0];
    this.reviewError.set('');

    if (firstLine && !this.hasReview(order.id, 'design')) {
      const res = await this.workflow.submitReview(order.id, user.id, {
        target: 'design',
        designId: firstLine.designId,
        rating: this.reviewRating(),
        comment: this.reviewComment(),
      });
      if (!res.success) {
        this.reviewError.set(res.error ?? 'Could not submit the design review.');
        return;
      }
    }

    if (firstLine?.printerId && !this.hasReview(order.id, 'printer')) {
      const res = await this.workflow.submitReview(order.id, user.id, {
        target: 'printer',
        printerId: firstLine.printerId,
        rating: this.reviewPrinterRating(),
        comment: this.reviewPrinterComment(),
      });
      if (!res.success) {
        this.reviewError.set(res.error ?? 'Could not submit the printer review.');
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
