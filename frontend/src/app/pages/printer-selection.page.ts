import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PrinterCardComponent } from '../components/printer-card.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-printer-selection-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PrinterCardComponent],
  templateUrl: './printer-selection.html',
})
export class PrinterSelectionPageComponent {
  readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly designId = signal<number>(701);
  readonly draft = this.workflow.draft;
  readonly design = computed(() => this.workflow.getDesignById(this.designId()) ?? this.workflow.designs()[0]);
  readonly product = computed(() => (this.draft() ? this.workflow.getProductById(this.draft()!.productId) : undefined));
  readonly compatiblePrinters = computed(() => {
    const product = this.product();
    return product ? this.workflow.printers().filter((printer) => printer.id === product.printerId || printer.rank === 'Premium') : this.workflow.printers();
  });
  readonly selectedPrinterId = signal<number | null>(this.draft()?.selectedPrinterId ?? null);
  readonly error = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designId.set(Number(params.get('id') ?? 701));
      if (!this.workflow.draft()) {
        this.router.navigate(['/customize', this.designId()]);
      }
    });
  }

  selectPrinter(printerId: number): void {
    this.selectedPrinterId.set(printerId);
    const draft = this.workflow.draft();
    if (!draft) return;
    this.workflow.setDraft({
      ...draft,
      selectedPrinterId: printerId,
    });
  }

  async addToCart(): Promise<void> {
    const user = this.auth.user();
    const draft = this.workflow.draft();
    if (!user || !draft || !this.selectedPrinterId()) {
      this.error.set('Select a printer before adding this configuration to cart.');
      return;
    }
    this.workflow.setDraft({ ...draft, selectedPrinterId: this.selectedPrinterId() });
    const result = await this.workflow.addDraftToCart(user.id);
    if (!result.success) {
      this.error.set(result.error ?? 'Unable to add configuration to cart.');
      return;
    }
    this.router.navigateByUrl('/cart');
  }
}
