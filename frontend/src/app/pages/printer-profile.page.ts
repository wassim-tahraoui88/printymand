import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

type ProductTemplate = {
  key: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  leadTimeDays: number;
};

@Component({
  selector: 'app-printer-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardShellComponent],
  templateUrl: './printer-profile.html',
})
export class PrinterProfilePageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);
  readonly user = computed(() => this.auth.user());
  readonly products = computed(() => (this.user() ? this.workflow.productsForPrinterUser(this.user()!.id) : []));

  readonly productTemplates: ProductTemplate[] = [
    {
      key: 'tshirt',
      name: 'T-Shirt',
      category: 'Apparel',
      description: 'Classic printable t-shirt with front and back print capability.',
      basePrice: 25,
      colors: ['white', 'black', 'navy'],
      sizes: ['S', 'M', 'L', 'XL'],
      leadTimeDays: 3,
    },
    {
      key: 'hoodie',
      name: 'Hoodie',
      category: 'Apparel',
      description: 'Midweight hoodie suitable for DTG and DTF production.',
      basePrice: 48,
      colors: ['black', 'sand', 'burgundy'],
      sizes: ['M', 'L', 'XL', 'XXL'],
      leadTimeDays: 4,
    },
    {
      key: 'mug',
      name: 'Mug',
      category: 'Drinkware',
      description: 'Ceramic mug with wraparound printable surface.',
      basePrice: 18,
      colors: ['white', 'black'],
      sizes: ['11oz'],
      leadTimeDays: 2,
    },
    {
      key: 'tote',
      name: 'Tote Bag',
      category: 'Accessories',
      description: 'Canvas tote bag for front-side artwork placement.',
      basePrice: 22,
      colors: ['sand', 'black'],
      sizes: ['One Size'],
      leadTimeDays: 3,
    },
    {
      key: 'phone-case',
      name: 'Phone Case',
      category: 'Accessories',
      description: 'Hard shell phone case with full-surface print.',
      basePrice: 27,
      colors: ['white', 'black'],
      sizes: ['iPhone', 'Samsung'],
      leadTimeDays: 4,
    },
  ];

  readonly productForm = signal({
    id: 0,
    templateKey: '',
    name: '',
    category: 'Apparel',
    description: '',
    basePrice: 25,
    colors: 'white, black, navy',
    sizes: 'S, M, L, XL',
    images: '',
    availability: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'DRAFT',
    leadTimeDays: 3,
  });

  readonly productImages = computed(() =>
    this.productForm()
      .images.split('\n')
      .map((value) => value.trim())
      .filter(Boolean),
  );

  readonly templateStatus = computed(() =>
    this.productTemplates.map((template) => {
      const existing = this.products().find((product) => product.name.toLowerCase() === template.name.toLowerCase());
      return { template, existing };
    }),
  );

  useTemplate(templateKey: string): void {
    const template = this.productTemplates.find((entry) => entry.key === templateKey);
    if (!template) return;

    const existing = this.products().find((product) => product.name.toLowerCase() === template.name.toLowerCase());
    if (existing) {
      this.editProduct(existing.id);
      return;
    }

    this.productForm.set({
      id: 0,
      templateKey: template.key,
      name: template.name,
      category: template.category,
      description: template.description,
      basePrice: template.basePrice,
      colors: template.colors.join(', '),
      sizes: template.sizes.join(', '),
      images: '',
      availability: 'ACTIVE',
      leadTimeDays: template.leadTimeDays,
    });
  }

  editProduct(productId: number): void {
    const product = this.products().find((entry) => entry.id === productId);
    if (!product) return;
    const matchedTemplate = this.productTemplates.find((template) => template.name === product.name);
    this.productForm.set({
      id: product.id,
      templateKey: matchedTemplate?.key ?? '',
      name: product.name,
      category: product.category,
      description: product.description,
      basePrice: product.basePrice,
      colors: product.colors.join(', '),
      sizes: product.sizes.join(', '),
      images: product.images.join('\n'),
      availability: product.availability,
      leadTimeDays: product.leadTimeDays,
    });
  }

  async onProductFilesChange(event: Event): Promise<void> {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    const images = await Promise.all(files.map(readFileAsDataUrl));
    this.productForm.set({
      ...this.productForm(),
      images: [...(this.productForm().images ? this.productForm().images.split('\n').filter(Boolean) : []), ...images].join('\n'),
    });
  }

  removeProductImage(index: number): void {
    this.productForm.set({
      ...this.productForm(),
      images: this.productImages()
        .filter((_, imageIndex) => imageIndex !== index)
        .join('\n'),
    });
  }

  clearProductImages(): void {
    this.productForm.set({
      ...this.productForm(),
      images: '',
    });
  }

  saveProduct(): void {
    const user = this.user();
    if (!user) return;
    const form = this.productForm();
    this.workflow.addOrUpdateProduct(
      {
        id: form.id || undefined,
        name: form.name,
        category: form.category,
        description: form.description,
        basePrice: form.basePrice,
        colors: form.colors.split(',').map((value) => value.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map((value) => value.trim()).filter(Boolean),
        images: form.images.split('\n').map((value) => value.trim()).filter(Boolean),
        availability: form.availability,
        leadTimeDays: form.leadTimeDays,
      },
      user.id,
    );

    this.productForm.set({
      id: 0,
      templateKey: '',
      name: '',
      category: 'Apparel',
      description: '',
      basePrice: 25,
      colors: 'white, black, navy',
      sizes: 'S, M, L, XL',
      images: '',
      availability: 'ACTIVE',
      leadTimeDays: 3,
    });
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
