import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-marketplace-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignCardComponent],
  templateUrl: './marketplace.html',
})
export class MarketplacePageComponent {
  readonly workflow = inject(WorkflowService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = this.workflow.categories;
  readonly search = signal('');
  readonly category = signal('All');
  readonly selectedProductId = signal<number | null>(null);

  readonly selectedProduct = computed(() => (this.selectedProductId() ? this.workflow.getProductById(this.selectedProductId()!) : undefined));
  readonly designs = computed(() => {
    const query = this.search().trim().toLowerCase();
    const category = this.category();
    const productId = this.selectedProductId();
    return this.workflow
      .designs()
      .filter((design) => design.status === 'ACTIVE')
      .filter((design) => category === 'All' || design.category === category)
      .filter((design) => !productId || design.assignedProductIds.includes(productId))
      .filter((design) => {
        if (!query) return true;
        return [design.title, design.designer, design.category, design.description].some((value) => value.toLowerCase().includes(query));
      });
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const search = params.get('search') ?? '';
      const category = params.get('category') ?? 'All';
      const product = params.get('product');
      this.search.set(search);
      this.category.set(this.categories().some((entry) => entry === category) ? category : 'All');
      this.selectedProductId.set(product ? Number(product) : null);
    });
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.search() || null,
        category: this.category() !== 'All' ? this.category() : null,
        product: this.selectedProductId() ?? null,
      },
      queryParamsHandling: '',
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.category.set('All');
    this.selectedProductId.set(null);
    this.applyFilters();
  }
}
