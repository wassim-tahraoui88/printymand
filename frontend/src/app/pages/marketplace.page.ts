import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { WorkflowService } from '../services/workflow.service';

export type MarketplaceSort = 'trending' | 'newest' | 'price_asc' | 'price_desc' | 'top_rated';

@Component({
  selector: 'app-marketplace-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignCardComponent],
  templateUrl: './marketplace.html',
})
export class MarketplacePageComponent {
  readonly workflow    = inject(WorkflowService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);

  readonly categories      = this.workflow.categories;
  readonly search          = signal('');
  readonly category        = signal('All');
  readonly selectedProductId = signal<number | null>(null);
  readonly sort            = signal<MarketplaceSort>('trending');

  readonly sortOptions: { value: MarketplaceSort; label: string }[] = [
    { value: 'trending',   label: 'Trending'    },
    { value: 'newest',     label: 'Newest'      },
    { value: 'top_rated',  label: 'Top rated'   },
    { value: 'price_asc',  label: 'Price: low → high' },
    { value: 'price_desc', label: 'Price: high → low' },
  ];

  readonly selectedProduct = computed(() =>
    this.selectedProductId() ? this.workflow.getProductById(this.selectedProductId()!) : undefined,
  );

  readonly designs = computed(() => {
    const query      = this.search().trim().toLowerCase();
    const category   = this.category();
    const productId  = this.selectedProductId();
    const sortKey    = this.sort();

    const filtered = this.workflow
      .marketplaceDesigns()
      .filter((d) => d.status === 'ACTIVE')
      .filter((d) => category === 'All' || d.category === category)
      .filter((d) => !productId || d.assignedProductIds.includes(productId))
      .filter((d) => {
        if (!query) return true;
        return [d.title, d.designer, d.category, d.description, ...d.tags]
          .some((v) => v.toLowerCase().includes(query));
      });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'newest':     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'top_rated':  return b.rating - a.rating;
        case 'price_asc':  return a.price  - b.price;
        case 'price_desc': return b.price  - a.price;
        default:           return (b.views + b.sales * 8) - (a.views + a.sales * 8); // trending
      }
    });
  });

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const search   = params.get('search')   ?? '';
        const category = params.get('category') ?? 'All';
        const product  = params.get('product');
        this.search.set(search);
        this.category.set(
          this.categories().some((c) => c === category) ? category : 'All',
        );
        this.selectedProductId.set(product ? Number(product) : null);
      });
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search:   this.search()   || null,
        category: this.category() !== 'All' ? this.category() : null,
        product:  this.selectedProductId() ?? null,
      },
      queryParamsHandling: '',
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.category.set('All');
    this.selectedProductId.set(null);
    this.sort.set('trending');
    this.applyFilters();
  }

  /** Count of active filters (excluding sort) — used for badge on clear button */
  readonly activeFilterCount = computed(() => {
    let n = 0;
    if (this.search())                    n++;
    if (this.category() !== 'All')        n++;
    if (this.selectedProductId() !== null) n++;
    return n;
  });
}
