import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../components/product-card.component';
import { PlatformStoreService } from '../services/platform-store.service';

export type ProductSort = 'popular' | 'top_rated' | 'price_asc' | 'price_desc';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.html',
})
export class ProductsPageComponent {
  private readonly store = inject(PlatformStoreService);

  readonly search = signal('');
  readonly category = signal('All');
  readonly pressroom = signal<number | 'all'>('all');
  readonly sort = signal<ProductSort>('popular');

  /** Pressrooms that have at least one product offering (for the filter). */
  readonly pressrooms = computed(() => this.store.printers());

  readonly categories = computed(() => [
    'All',
    ...Array.from(new Set(this.store.products().map((p) => p.category))),
  ]);

  readonly sortOptions: { value: ProductSort; label: string }[] = [
    { value: 'popular',   label: 'Most popular'     },
    { value: 'top_rated', label: 'Top rated'        },
    { value: 'price_asc', label: 'Price: low → high'},
    { value: 'price_desc',label: 'Price: high → low'},
  ];

  readonly products = computed(() => {
    const query   = this.search().trim().toLowerCase();
    const cat     = this.category();
    const sortKey = this.sort();

    const pressroom = this.pressroom();

    const filtered = this.store
      .products()
      .filter((p) => p.availability !== 'DRAFT')
      .filter((p) => cat === 'All' || p.category === cat)
      .filter(
        (p) =>
          pressroom === 'all' ||
          this.store.printersForProduct(p.id).some((pr) => pr.id === pressroom),
      )
      .filter((p) => {
        if (!query) return true;
        return [p.name, p.category, p.description].some((v) => v.toLowerCase().includes(query));
      });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'top_rated':  return b.rating - a.rating;
        case 'price_asc':  return a.basePrice - b.basePrice;
        case 'price_desc': return b.basePrice - a.basePrice;
        default:           return b.totalOrders - a.totalOrders;
      }
    });
  });

  readonly activeFilterCount = computed(() => {
    let n = 0;
    if (this.search()) n++;
    if (this.category() !== 'All') n++;
    if (this.pressroom() !== 'all') n++;
    return n;
  });

  clearFilters(): void {
    this.search.set('');
    this.category.set('All');
    this.pressroom.set('all');
    this.sort.set('popular');
  }
}
