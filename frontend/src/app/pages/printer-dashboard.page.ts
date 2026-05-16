import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardSidebarComponent, DashboardNavSection } from '../components/dashboard-sidebar.component';
import type { PrintingMethod } from '../models/types';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-printer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardSidebarComponent],
  templateUrl: './printer-dashboard.html',
})
export class PrinterDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);

  readonly activeTab = signal('overview');
  readonly sidebarOpen = signal(false);

  readonly nav: DashboardNavSection[] = [
    {
      items: [
        { id: 'overview',  label: 'Overview',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'requests',  label: 'Order requests', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'queue',     label: 'Print queue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { id: 'products',  label: 'Products',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { id: 'earnings',  label: 'Earnings',  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
      ],
    },
  ];

  readonly user = computed(() => this.auth.user());
  readonly products = computed(() => (this.user() ? this.workflow.productsForPrinterUser(this.user()!.id) : []));
  /** Spec step 3: requests awaiting accept/reject. */
  readonly requests = computed(() => (this.user() ? this.workflow.ordersAwaitingPrinter(this.user()!.id) : []));
  /** Accepted + paid lines this printer fulfills. */
  readonly fulfillmentLines = computed(() => (this.user() ? this.workflow.fulfillmentLinesForPrinter(this.user()!.id) : []));
  readonly totals = computed(() => (this.user() ? this.workflow.printerTotals(this.user()!.id) : { products: 0, revenue: 0, fulfillmentRate: 0, rating: 0 }));
  readonly availability = computed(() => {
    const u = this.user();
    return u ? this.workflow.getPrinterByUserId(u.id)?.availability ?? 'available' : 'available';
  });

  readonly error = signal('');
  /** Allowed post-payment fulfillment steps (spec: Confirmed → Printing → Shipped → Delivered). */
  readonly fulfillmentSteps = ['Confirmed', 'Printing', 'Shipped', 'Delivered'] as const;

  // ── Performance / level (spec "Printer roles") ──
  readonly level = computed(() => this.user()?.printerRank ?? 'Verified');
  readonly fulfillmentScore = computed(() => this.user()?.printerProfile?.fulfillmentScore ?? 0);
  readonly payouts = computed(() => (this.user() ? this.workflow.printerPayoutsForUser(this.user()!.id) : []));

  // ── Fulfillment setup (spec) ──
  readonly allMethods: PrintingMethod[] = ['DTF', 'sublimation', 'screen-printing', 'embroidery', 'vinyl'];
  readonly settingsMsg = signal('');

  readonly methods = computed<PrintingMethod[]>(() => this.user()?.printerProfile?.printingMethods ?? ['DTF']);
  readonly processingDays = computed(() => this.user()?.printerProfile?.processingDays ?? 3);

  // ── Global catalog opt-in (printers choose + price predefined products only) ──
  /** The full platform catalog — printers cannot create or upload products. */
  readonly catalog = computed(() => this.workflow.products());
  /** Local price draft per product id (so typing doesn't commit every keystroke). */
  readonly priceDraft = signal<Record<number, number>>({});

  offeringFor(productId: number) {
    const u = this.user();
    return u ? this.workflow.getOffering(this.workflow.getPrinterByUserId(u.id)?.id ?? -1, productId) : undefined;
  }

  isSupported(productId: number): boolean {
    return !!this.offeringFor(productId);
  }

  priceFor(productId: number): number {
    const draft = this.priceDraft()[productId];
    if (draft !== undefined) return draft;
    const offering = this.offeringFor(productId);
    if (offering) return offering.basePrice;
    return this.workflow.getProductById(productId)?.basePrice ?? 0;
  }

  setPriceDraft(productId: number, value: number): void {
    this.priceDraft.set({ ...this.priceDraft(), [productId]: Number(value) || 0 });
  }

  toggleSupport(productId: number, checked: boolean): void {
    const user = this.user();
    if (!user) return;
    if (checked) {
      this.workflow.setPrinterOffering(user.id, productId, this.priceFor(productId), true);
    } else {
      this.workflow.removePrinterOffering(user.id, productId);
    }
  }

  saveOffering(productId: number): void {
    const user = this.user();
    if (!user) return;
    const existing = this.offeringFor(productId);
    this.workflow.setPrinterOffering(user.id, productId, this.priceFor(productId), existing?.available ?? true);
    this.settingsMsg.set('Pricing saved.');
  }

  toggleOfferingAvailable(productId: number, available: boolean): void {
    const user = this.user();
    if (!user) return;
    this.workflow.setPrinterOffering(user.id, productId, this.priceFor(productId), available);
  }

  toggleMethod(method: PrintingMethod, checked: boolean): void {
    const current = new Set<PrintingMethod>(this.methods());
    if (checked) current.add(method);
    else current.delete(method);
    this.auth.updatePrinterProfile({ printingMethods: Array.from(current) });
  }

  saveProcessingDays(value: number): void {
    this.auth.updatePrinterProfile({ processingDays: Number(value) || 1 });
    this.settingsMsg.set('Fulfillment settings updated.');
  }

  setAvailability(value: 'available' | 'busy' | 'holiday'): void {
    const u = this.user();
    if (u) this.workflow.setPrinterAvailability(u.id, value);
  }

  accept(orderId: number | string): void {
    const result = this.workflow.acceptOrderRequest(orderId);
    if (!result.success) this.error.set(result.error ?? 'Could not accept the request.');
  }

  reject(orderId: number | string): void {
    const result = this.workflow.rejectOrderRequest(orderId);
    if (!result.success) this.error.set(result.error ?? 'Could not reject the request.');
  }

  nextStep(current: string): string | null {
    const idx = this.fulfillmentSteps.indexOf(current as (typeof this.fulfillmentSteps)[number]);
    if (idx === -1 || idx === this.fulfillmentSteps.length - 1) return null;
    return this.fulfillmentSteps[idx + 1];
  }

  advance(orderId: number | string, lineId: number): void {
    this.workflow.advanceOrderLineStatus(orderId, lineId);
  }
}
