import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { StatCardComponent } from '../components/stat-card.component';
import { UiModalComponent } from '../components/ui-modal.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-customer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardShellComponent, StatCardComponent, UiModalComponent],
  templateUrl: './customer-dashboard.html',
})
export class CustomerDashboardPageComponent {
  private readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);

  readonly user = computed(() => this.auth.user());
  readonly orders = computed(() => (this.user() ? this.workflow.currentOrders() : []));
  readonly reviews = computed(() => this.workflow.reviews().filter((review) => review.customerId === this.user()?.id));
  readonly addresses = computed(() => this.user()?.customerProfile?.savedAddresses ?? []);
  readonly paymentPreferences = computed(() => this.user()?.customerProfile?.paymentPreferences ?? []);
  readonly reviewOrderId = signal<number | string | null>(null);
  readonly reviewRating = signal(5);
  readonly reviewComment = signal('');
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

  readonly stats = computed(() => {
    const orders = this.orders();
    const delivered = orders.filter((order) => this.workflow.getOrderStatus(order) === 'Delivered').length;
    const inFlight = orders.filter((order) => ['Pending', 'Accepted', 'Printing', 'Shipped'].includes(this.workflow.getOrderStatus(order))).length;
    return {
      orders: orders.length,
      delivered,
      inFlight,
      spend: orders.reduce((sum, order) => sum + order.total, 0),
    };
  });

  statusClass(status: string): string {
    return `pm-status pm-status-${status.toLowerCase()}`;
  }

  openReviewModal(orderId: number | string): void {
    this.reviewOrderId.set(orderId);
    this.reviewRating.set(5);
    this.reviewComment.set('');
  }

  closeReviewModal(): void {
    this.reviewOrderId.set(null);
  }

  async submitReview(): Promise<void> {
    const user = this.user();
    const orderId = this.reviewOrderId();
    if (!user || !orderId) return;
    await this.workflow.submitReview(orderId, user.id, {
      rating: this.reviewRating(),
      comment: this.reviewComment(),
    });
    this.closeReviewModal();
  }

  saveAddress(): void {
    this.auth.saveAddress(this.addressForm());
    this.addressForm.set({
      id: undefined,
      label: '',
      recipient: '',
      line1: '',
      city: 'Tunis',
      governorate: 'Tunis',
      postalCode: '1000',
      phone: '',
      isDefault: false,
    });
  }

  editAddress(addressId: number): void {
    const address = this.addresses().find((entry) => entry.id === addressId);
    if (!address) return;
    this.addressForm.set({ ...address });
  }

  removeAddress(addressId: number): void {
    this.auth.removeAddress(addressId);
  }

  savePaymentPreference(): void {
    this.auth.savePaymentPreference(this.paymentForm());
    this.paymentForm.set({
      id: '',
      label: '',
      provider: 'card',
      details: '',
      isDefault: false,
      enabled: true,
    });
  }

  updateProfileField(field: 'name' | 'email' | 'address', value: string): void {
    this.auth.updateProfile({ [field]: value });
  }
}
