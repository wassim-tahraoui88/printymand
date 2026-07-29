import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrinterCardComponent } from '../components/printer-card.component';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

@Component({
  selector: 'app-printer-selection-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PrinterCardComponent],
  templateUrl: './printer-selection.html',
})
export class PrinterSelectionPageComponent {
  readonly store = inject(PlatformStoreService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly designId = signal<number>(0);
  readonly draft = this.store.customizationDraft;
  /** Undefined for an unknown id — the template renders a "not found" branch. */
  readonly design = computed(() => this.store.getDesignById(this.designId()));

  /** Items the buyer configured (one per product, with quantity). */
  readonly items = computed(() => this.draft()?.items ?? []);
  readonly orderProducts = computed(() =>
    this.items()
      .map((it) => ({ product: this.store.getProductById(it.productId), qty: it.quantity }))
      .filter((x): x is { product: NonNullable<typeof x.product>; qty: number } => !!x.product),
  );

  // Spec "Printer Selection": filter by availability, rank, delivery time, price, location.
  readonly rankFilter = signal<'all' | 'Verified' | 'Gold' | 'Premium'>('all');
  readonly locationFilter = signal<string>('all');
  readonly maxDelivery = signal<number>(14);
  readonly sortBy = signal<'rank' | 'rating' | 'delivery' | 'price'>('rating');

  readonly locations = computed(() =>
    Array.from(new Set(this.store.printers().map((p) => p.location))).sort(),
  );

  /** Total the buyer pays at this printer for the WHOLE multi-product order. */
  priceFor(printerId: number): number {
    const margin = this.store.platformSettings().margin;
    return this.items().reduce(
      (sum, it) => sum + (this.store.offeringPrice(printerId, it.productId) + margin) * it.quantity,
      0,
    );
  }

  /** This printer's own description(s) for the selected product(s). */
  noteFor(printerId: number): string {
    const parts: string[] = [];
    for (const it of this.items()) {
      const off = this.store.getOffering(printerId, it.productId);
      const prod = this.store.getProductById(it.productId);
      if (off?.description && prod) parts.push(`${prod.name}: ${off.description}`);
    }
    return parts.join(' · ');
  }

  readonly compatiblePrinters = computed(() => {
    const ids = this.items().map((it) => it.productId);
    const rank = this.rankFilter();
    const loc = this.locationFilter();
    const maxDays = this.maxDelivery();
    // Printers must be available AND offer every product in the order.
    const base = this.store.printers().filter((printer) => {
      if (printer.availability !== 'available') return false;
      return ids.every((pid) => this.store.printersForProduct(pid).some((pr) => pr.id === printer.id));
    });
    const filtered = base
      .filter((p) => rank === 'all' || p.rank === rank)
      .filter((p) => loc === 'all' || p.location === loc)
      .filter((p) => p.deliveryDays <= maxDays);
    const rankWeight = { Verified: 1, Gold: 2, Premium: 3 } as const;
    return [...filtered].sort((a, b) => {
      switch (this.sortBy()) {
        case 'rank':     return rankWeight[b.rank] - rankWeight[a.rank];
        case 'delivery': return a.deliveryDays - b.deliveryDays;
        case 'price':    return this.priceFor(a.id) - this.priceFor(b.id);
        default:         return b.rating - a.rating;
      }
    });
  });

  readonly selectedPrinterId = signal<number | null>(this.draft()?.selectedPrinterId ?? null);
  readonly error = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designId.set(Number(params.get('id')) || 0);
      if (!this.store.customizationDraft()) {
        this.router.navigate(['/customize', this.designId()]);
      }
    });
  }

  selectPrinter(printerId: number): void {
    this.selectedPrinterId.set(printerId);
    const draft = this.store.customizationDraft();
    if (!draft) return;
    this.store.setCustomizationDraft({
      ...draft,
      selectedPrinterId: printerId,
    });
  }

  /**
   * New flow: choose a printer and SEND THE REQUEST directly. No cart yet —
   * the printer must accept before the customer pays (from the cart).
   */
  sendRequest(): void {
    const user = this.auth.user();
    const draft = this.store.customizationDraft();
    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }
    if (!draft || !this.selectedPrinterId()) {
      this.error.set('Select a printer before sending your request.');
      return;
    }
    this.store.setCustomizationDraft({ ...draft, selectedPrinterId: this.selectedPrinterId() });

    // The draft is persisted, so the pressroom may have gone busy or dropped a
    // product since it was built. Report exactly what changed rather than a
    // generic failure the buyer cannot act on.
    const issue = this.store.draftIssue();
    if (issue) {
      this.error.set(issue);
      return;
    }

    const order = this.store.submitDraftOrderRequest(user.id);
    if (!order) {
      this.error.set('Could not send the request. Please try again.');
      return;
    }
    this.router.navigateByUrl(`/tracking/${order.id}`);
  }
}
