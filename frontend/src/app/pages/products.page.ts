import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../components/product-card.component';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.html',
})
export class ProductsPageComponent {
  private readonly workflow = inject(WorkflowService);

  readonly search = signal('');
  readonly category = signal('All');
  readonly categories = computed(() => ['All', ...Array.from(new Set(this.workflow.products().map((product) => product.category)))]);
  readonly products = computed(() =>
    this.workflow
      .products()
      .filter((product) => product.availability !== 'DRAFT')
      .filter((product) => this.category() === 'All' || product.category === this.category())
      .filter((product) => {
        const query = this.search().trim().toLowerCase();
        if (!query) return true;
        return [product.name, product.printerName, product.description].some((value) => value.toLowerCase().includes(query));
      }),
  );
}
