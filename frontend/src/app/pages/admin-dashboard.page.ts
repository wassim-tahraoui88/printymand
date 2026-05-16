import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardSidebarComponent, DashboardNavSection } from '../components/dashboard-sidebar.component';
import type { AccountStatus, User } from '../models/types';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardSidebarComponent],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);

  readonly activeTab = signal('overview');
  readonly sidebarOpen = signal(false);

  readonly nav: DashboardNavSection[] = [
    {
      items: [
        { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'users',   label: 'Users',    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'moderation', label: 'Moderation', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'catalog', label: 'Catalog',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { id: 'designs', label: 'Designs',  icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'orders',  label: 'Orders',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      ],
    },
  ];

  readonly search = signal('');

  readonly overview = computed(() => this.workflow.adminOverview());

  readonly users = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.auth.users().filter((u) => {
      if (!query) return true;
      return [u.name, u.email, u.role].some((v) => v.toLowerCase().includes(query));
    });
  });

  readonly designs = computed(() => this.workflow.allDesigns().filter((d) => !d.isUserUpload));
  readonly pendingDesigns = computed(() => this.designs().filter((d) => (d.moderation ?? 'APPROVED') === 'PENDING'));

  readonly allOrders = computed(() => this.workflow.orders());

  // ── Global product catalog (admin-owned) ──
  readonly catalog = computed(() => this.workflow.products());
  readonly productForm = signal({
    id: 0,
    name: '',
    category: 'Apparel',
    description: '',
    basePrice: 25,
    colors: 'white, black',
    sizes: 'S, M, L, XL',
    image: '',
  });
  readonly catalogMsg = signal('');

  editProduct(productId: number): void {
    const p = this.catalog().find((x) => x.id === productId);
    if (!p) return;
    this.productForm.set({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      basePrice: p.basePrice,
      colors: p.colors.join(', '),
      sizes: p.sizes.join(', '),
      image: p.images[0] ?? '',
    });
  }

  saveProduct(): void {
    const f = this.productForm();
    if (!f.name.trim()) {
      this.catalogMsg.set('Product name is required.');
      return;
    }
    this.workflow.addOrUpdateGlobalProduct({
      id: f.id || undefined,
      name: f.name.trim(),
      category: f.category,
      description: f.description,
      basePrice: Number(f.basePrice) || 0,
      colors: f.colors.split(',').map((c) => c.trim()).filter(Boolean),
      sizes: f.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      images: f.image.trim() ? [f.image.trim()] : ['/placeholder-image.svg'],
    });
    this.productForm.set({ id: 0, name: '', category: 'Apparel', description: '', basePrice: 25, colors: 'white, black', sizes: 'S, M, L, XL', image: '' });
    this.catalogMsg.set('Catalog updated.');
  }

  removeProduct(productId: number): void {
    this.workflow.removeGlobalProduct(productId);
  }

  readonly settingsForm = signal({ margin: 0, designerRoyalty: 0, payoutThreshold: 0 });
  readonly settingsMsg = signal('');

  constructor() {
    const s = this.workflow.platformSettings();
    this.settingsForm.set({ margin: s.margin, designerRoyalty: s.designerRoyalty, payoutThreshold: s.payoutThreshold });
  }

  adminId(): number {
    return this.auth.user()?.id ?? 0;
  }

  setDesignStatus(designId: number, status: 'ACTIVE' | 'ARCHIVED' | 'REMOVED'): void {
    this.workflow.setDesignStatus(designId, status);
  }

  moderate(designId: number, decision: 'APPROVED' | 'REJECTED'): void {
    this.workflow.moderateDesign(this.adminId(), designId, decision);
  }

  toggleFeatured(targetType: 'design' | 'designer' | 'printer', targetId: number): void {
    this.workflow.toggleFeatured(this.adminId(), targetType, targetId);
  }

  isFeatured(targetType: 'design' | 'designer' | 'printer', targetId: number): boolean {
    return this.workflow.isFeatured(targetType, targetId);
  }

  saveSettings(): void {
    const f = this.settingsForm();
    this.workflow.updatePlatformSettings({
      margin: Number(f.margin) || 0,
      designerRoyalty: Number(f.designerRoyalty) || 0,
      payoutThreshold: Number(f.payoutThreshold) || 0,
    });
    this.settingsMsg.set('Platform settings updated.');
  }

  accountStatus(user: User): AccountStatus {
    return user.accountStatus ?? (user.suspended ? 'SUSPENDED' : 'ACTIVE');
  }

  /** Spec admin powers: verify identity, suspend, ban, reactivate accounts. */
  setAccountStatus(userId: number, status: AccountStatus): void {
    this.auth.setAccountStatus(userId, status);
  }
}
