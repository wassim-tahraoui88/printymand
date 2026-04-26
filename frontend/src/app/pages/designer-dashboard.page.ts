import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { StatCardComponent } from '../components/stat-card.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-designer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardShellComponent, StatCardComponent],
  templateUrl: './designer-dashboard.html',
})
export class DesignerDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);

  readonly user = computed(() => this.auth.user());
  readonly designs = computed(() => (this.user() ? this.workflow.designsForDesigner(this.user()!.id) : []));
  readonly analytics = computed(() => (this.user() ? this.workflow.designerAnalytics(this.user()!.id) : []));
  readonly totals = computed(() => (this.user() ? this.workflow.designerTotals(this.user()!.id) : { earnings: 0, designs: 0, orders: 0, avgConversion: 0 }));
  readonly payouts = computed(() => this.workflow.payouts().filter((entry) => entry.designerId === this.user()?.id));
  readonly designForm = signal({
    id: 0,
    title: '',
    image: '',
    category: 'Culture',
    description: '',
    price: 18,
  });
  readonly profileLinks = signal((this.user()?.designerProfile?.portfolioLinks ?? []).map((link) => link.url).join('\n'));

  editDesign(designId: number): void {
    const design = this.designs().find((entry) => entry.id === designId);
    if (!design) return;
    this.designForm.set({
      id: design.id,
      title: design.title,
      image: design.image,
      category: design.category,
      description: design.description,
      price: design.price,
    });
  }

  async onDesignFileChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const result = await readFileAsDataUrl(file);
    this.designForm.set({ ...this.designForm(), image: result });
  }

  saveDesign(): void {
    const user = this.user();
    if (!user) return;
    const current = this.designForm();
    const created = this.workflow.addOrUpdateDesign(
      {
        id: current.id || undefined,
        title: current.title,
        image: current.image,
        category: current.category,
        description: current.description,
        price: current.price,
      },
      user.id,
    );

    this.workflow.assignProductsToDesign(created.id, created.assignedProductIds.length ? created.assignedProductIds : this.workflow.products().slice(0, 2).map((product) => product.id));
    this.designForm.set({ id: 0, title: '', image: '', category: 'Culture', description: '', price: 18 });
  }

  toggleArchive(designId: number, archived: boolean): void {
    this.workflow.setDesignStatus(designId, archived ? 'ACTIVE' : 'ARCHIVED');
  }

  updateAssignment(designId: number, productId: number, checked: boolean): void {
    const design = this.designs().find((entry) => entry.id === designId);
    if (!design) return;
    const nextIds = checked
      ? Array.from(new Set([...design.assignedProductIds, productId]))
      : design.assignedProductIds.filter((id) => id !== productId);
    this.workflow.assignProductsToDesign(designId, nextIds);
  }

  updatePlacement(designId: number, productId: number, field: 'x' | 'y' | 'scale', value: number): void {
    const existing = this.workflow.getDesignConfig(designId, productId) ?? {
      productId,
      defaultPlacement: { x: 50, y: 50, scale: 0.4 },
      availableColors: this.workflow.getProductById(productId)?.colors ?? ['white'],
    };
    this.workflow.saveDesignProductConfiguration(designId, {
      ...existing,
      defaultPlacement: {
        ...existing.defaultPlacement,
        [field]: value,
      },
    });
  }

  updateAvailableColors(designId: number, productId: number, raw: string): void {
    const existing = this.workflow.getDesignConfig(designId, productId) ?? {
      productId,
      defaultPlacement: { x: 50, y: 50, scale: 0.4 },
      availableColors: [],
    };
    this.workflow.saveDesignProductConfiguration(designId, {
      ...existing,
      availableColors: raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    });
  }

  saveProfile(): void {
    this.auth.updateDesignerProfile({
      portfolioLinks: this.profileLinks()
        .split('\n')
        .map((url, index) => url.trim())
        .filter(Boolean)
        .map((url, index) => ({ id: `link-${index}`, label: `Link ${index + 1}`, url })),
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
