import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardSidebarComponent, DashboardNavSection } from '../components/dashboard-sidebar.component';
import { DonutChartComponent, type DonutSlice } from '../components/donut-chart.component';
import type { PrintingMethod } from '../models/types';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

const CHART_COLORS = ['#C74A2B', '#E89E1C', '#2E7D5B', '#3B6EA5', '#7C3AED', '#0E7490'];

@Component({
  selector: 'app-printer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardSidebarComponent, DonutChartComponent],
  templateUrl: './printer-dashboard.html',
})
export class PrinterDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly store = inject(PlatformStoreService);

  readonly activeTab = signal('overview');
  readonly sidebarOpen = signal(false);

  readonly nav: DashboardNavSection[] = [
    {
      items: [
        { id: 'overview',  label: 'Overview',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'requests',  label: 'Order requests', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'queue',     label: 'Print queue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { id: 'products',  label: 'Products',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'earnings',  label: 'Earnings',  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'account',   label: 'Account',   icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      ],
    },
  ];

  readonly user = computed(() => this.auth.user());
  readonly products = computed(() => (this.user() ? this.store.productsForPrinterUser(this.user()!.id) : []));
  /** Spec step 3: requests awaiting accept/reject. */
  readonly requests = computed(() => (this.user() ? this.store.ordersAwaitingPrinter(this.user()!.id) : []));
  /** Requests the customer canceled (incl. after the printer accepted, pre-payment). */
  readonly canceledOrders = computed(() => (this.user() ? this.store.canceledOrdersForPrinter(this.user()!.id) : []));
  /** Accepted + paid lines this printer fulfills. */
  readonly fulfillmentLines = computed(() => (this.user() ? this.store.fulfillmentLinesForPrinter(this.user()!.id) : []));
  readonly totals = computed(() => (this.user() ? this.store.printerTotals(this.user()!.id) : { products: 0, revenue: 0, fulfillmentRate: 0, rating: 0 }));

  // ── Analytics ──
  readonly confirmedCount = computed(() => this.fulfillmentLines().length);
  readonly deliveredCount = computed(() => this.fulfillmentLines().filter((l) => l.status === 'Delivered').length);
  readonly customersCount = computed(
    () => new Set(this.fulfillmentLines().map((l) => l.customer?.id).filter((x): x is number => x != null)).size,
  );
  /** Orders-by-status donut from this printer's fulfillment pipeline. */
  readonly statusChart = computed<DonutSlice[]>(() => {
    const order = ['Confirmed', 'Printing', 'Shipped', 'Delivered', 'Pending'];
    const counts = new Map<string, number>();
    for (const l of this.fulfillmentLines()) counts.set(l.status, (counts.get(l.status) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([label, value], i) => ({ label, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  });
  readonly productMixChart = computed<DonutSlice[]>(() => {
    const counts = new Map<string, number>();
    for (const l of this.fulfillmentLines()) counts.set(l.productName, (counts.get(l.productName) ?? 0) + (l.quantity ?? 1));
    return [...counts.entries()].map(([label, value], i) => ({ label, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  });
  readonly availability = computed(() => {
    const u = this.user();
    return u ? this.store.getPrinterByUserId(u.id)?.availability ?? 'available' : 'available';
  });

  readonly error = signal('');
  /** Allowed post-payment fulfillment steps (spec: Confirmed → Printing → Shipped → Delivered). */
  readonly fulfillmentSteps = ['Confirmed', 'Printing', 'Shipped', 'Delivered'] as const;

  // ── Performance / level (spec "Printer roles") ──
  readonly level = computed(() => this.user()?.printerRank ?? 'Verified');
  readonly fulfillmentScore = computed(() => this.user()?.printerProfile?.fulfillmentScore ?? 0);
  readonly payouts = computed(() => (this.user() ? this.store.printerPayoutsForUser(this.user()!.id) : []));

  // ── Fulfillment setup (spec) ──
  readonly allMethods: PrintingMethod[] = ['DTF', 'sublimation', 'screen-printing', 'embroidery', 'vinyl'];
  readonly settingsMsg = signal('');

  readonly methods = computed<PrintingMethod[]>(() => this.user()?.printerProfile?.printingMethods ?? ['DTF']);
  readonly processingDays = computed(() => this.user()?.printerProfile?.processingDays ?? 3);

  // ── Global catalog opt-in (printers choose + price predefined products only) ──
  /** The full platform catalog — printers cannot create or upload products. */
  readonly catalog = computed(() => this.store.products());
  /** Local drafts so typing doesn't commit every keystroke. */
  readonly priceDraft = signal<Record<number, number>>({});
  readonly descDraft = signal<Record<number, string>>({});
  readonly offeringMsg = signal<Record<number, string>>({});

  offeringFor(productId: number) {
    const u = this.user();
    return u ? this.store.getOffering(this.store.getPrinterByUserId(u.id)?.id ?? -1, productId) : undefined;
  }

  isSupported(productId: number): boolean {
    return !!this.offeringFor(productId);
  }

  /** Admin-set minimum price (floor) for a product. */
  floorFor(productId: number): number {
    return this.store.getProductById(productId)?.basePrice ?? 0;
  }

  priceFor(productId: number): number {
    const draft = this.priceDraft()[productId];
    if (draft !== undefined) return draft;
    const offering = this.offeringFor(productId);
    if (offering) return offering.basePrice;
    return this.floorFor(productId);
  }

  descFor(productId: number): string {
    const draft = this.descDraft()[productId];
    if (draft !== undefined) return draft;
    return this.offeringFor(productId)?.description ?? '';
  }

  setPriceDraft(productId: number, value: number): void {
    this.priceDraft.set({ ...this.priceDraft(), [productId]: Number(value) || 0 });
  }

  setDescDraft(productId: number, value: string): void {
    this.descDraft.set({ ...this.descDraft(), [productId]: value });
  }

  toggleSupport(productId: number, checked: boolean): void {
    const user = this.user();
    if (!user) return;
    if (checked) {
      this.store.setPrinterOffering(user.id, productId, Math.max(this.priceFor(productId), this.floorFor(productId)), true, this.descFor(productId));
    } else {
      this.store.removePrinterOffering(user.id, productId);
    }
  }

  saveOffering(productId: number): void {
    const user = this.user();
    if (!user) return;
    const existing = this.offeringFor(productId);
    const res = this.store.setPrinterOffering(
      user.id,
      productId,
      this.priceFor(productId),
      existing?.available ?? true,
      this.descFor(productId),
    );
    const msg = res.clamped
      ? `Price raised to the ${res.floor} TND minimum set by the platform.`
      : 'Saved.';
    this.offeringMsg.set({ ...this.offeringMsg(), [productId]: msg });
  }

  toggleOfferingAvailable(productId: number, available: boolean): void {
    const user = this.user();
    if (!user) return;
    this.store.setPrinterOffering(user.id, productId, this.priceFor(productId), available, this.descFor(productId));
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
    if (u) this.store.setPrinterAvailability(u.id, value);
  }

  accept(orderId: number | string): void {
    const user = this.user();
    if (!user) return;
    const result = this.store.acceptOrderRequest(orderId, user.id);
    if (!result.success) this.error.set(result.error ?? 'Could not accept the request.');
  }

  reject(orderId: number | string): void {
    const user = this.user();
    if (!user) return;
    const result = this.store.rejectOrderRequest(orderId, user.id);
    if (!result.success) this.error.set(result.error ?? 'Could not reject the request.');
  }

  nextStep(current: string): string | null {
    const idx = this.fulfillmentSteps.indexOf(current as (typeof this.fulfillmentSteps)[number]);
    if (idx === -1 || idx === this.fulfillmentSteps.length - 1) return null;
    return this.fulfillmentSteps[idx + 1];
  }

  advance(orderId: number | string, lineId: number): void {
    const user = this.user();
    if (!user) return;
    const result = this.store.advanceOrderLineStatus(orderId, lineId, user.id);
    if (!result.success) this.error.set(result.error ?? 'Could not update this item.');
  }
}
