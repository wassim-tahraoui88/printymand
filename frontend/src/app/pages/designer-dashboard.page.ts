import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DashboardSidebarComponent, DashboardNavSection } from '../components/dashboard-sidebar.component';
import { DonutChartComponent, type DonutSlice } from '../components/donut-chart.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

const CHART_COLORS = ['#C74A2B', '#E89E1C', '#2E7D5B', '#3B6EA5', '#7C3AED', '#0E7490', '#B45309', '#9A3412'];

@Component({
  selector: 'app-designer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardSidebarComponent, DonutChartComponent],
  templateUrl: './designer-dashboard.html',
})
export class DesignerDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal('overview');
  readonly sidebarOpen = signal(false);

  constructor() {
    // Deep-link from the storefront "Edit design" cards: ?edit=<designId>
    const editId = Number(this.route.snapshot.queryParamMap.get('edit'));
    if (editId) {
      queueMicrotask(() => this.editDesign(editId));
    }
  }

  readonly nav: DashboardNavSection[] = [
    {
      items: [
        { id: 'overview',  label: 'Overview',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'designs',   label: 'Designs',   icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'payouts',   label: 'Payouts',   icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'profile',   label: 'Storefront Settings',   icon: 'M3 9l1-5h16l1 5M4 9v11a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16M9 21v-6h6v6' },
      ],
    },
  ];

  readonly user = computed(() => this.auth.user());
  readonly designs = computed(() => (this.user() ? this.workflow.designsForDesigner(this.user()!.id) : []));
  readonly analytics = computed(() => (this.user() ? this.workflow.designerAnalytics(this.user()!.id) : []));

  /** Pie data: sales split across the designer's designs. */
  readonly salesChart = computed<DonutSlice[]>(() =>
    this.analytics()
      .filter((a) => a.sales > 0)
      .map((a, i) => ({
        label: this.workflow.getDesignById(a.designId)?.title ?? `#${a.designId}`,
        value: a.sales,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
  );

  /** Pie data: views split across designs. */
  readonly viewsChart = computed<DonutSlice[]>(() =>
    this.analytics()
      .filter((a) => a.views > 0)
      .map((a, i) => ({
        label: this.workflow.getDesignById(a.designId)?.title ?? `#${a.designId}`,
        value: a.views,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
  );
  readonly totals = computed(() => (this.user() ? this.workflow.designerTotals(this.user()!.id) : { earnings: 0, designs: 0, orders: 0, avgConversion: 0 }));
  readonly payouts = computed(() => this.workflow.payouts().filter((p) => p.designerId === this.user()?.id));

  // ── Upload wizard ──────────────────────────────────────────────
  // Step 1: upload artwork (≤ 1 MB). Step 2: pick compatible products and
  // customize the design per product (placement, colors, copy).
  readonly MAX_IMAGE_BYTES = 1024 * 1024;
  readonly wizardStep = signal<1 | 2>(1);
  readonly uploadError = signal('');

  // Spec: the designer does NOT set price. Multiple categories + up to 10 tags.
  readonly designForm = signal({
    id: 0,
    title: '',
    image: '',
    categories: [] as string[],
    tags: [] as string[],
    description: '',
  });
  readonly tagInput = signal('');
  readonly MAX_TAGS = 10;

  /** Platform-controlled category list (admin owns it). */
  readonly allCategories = computed(() => this.workflow.platformSettings().categories);

  toggleCategory(cat: string): void {
    const f = this.designForm();
    const set = new Set(f.categories);
    if (set.has(cat)) set.delete(cat);
    else set.add(cat);
    this.designForm.set({ ...f, categories: [...set] });
  }

  isCategory(cat: string): boolean {
    return this.designForm().categories.includes(cat);
  }

  addTag(): void {
    const value = this.tagInput().trim().toLowerCase();
    const f = this.designForm();
    if (!value || f.tags.includes(value) || f.tags.length >= this.MAX_TAGS) {
      this.tagInput.set('');
      return;
    }
    this.designForm.set({ ...f, tags: [...f.tags, value] });
    this.tagInput.set('');
  }

  removeTag(tag: string): void {
    const f = this.designForm();
    this.designForm.set({ ...f, tags: f.tags.filter((t) => t !== tag) });
  }

  /** Per-product designer customization keyed by product id. */
  readonly productConfigs = signal<
    Record<number, { selected: boolean; x: number; y: number; scale: number; colors: string[]; sizes: string[]; title: string; description: string }>
  >({});

  readonly allProducts = computed(() => this.workflow.products());

  private blankConfig() {
    return { selected: false, x: 50, y: 48, scale: 0.42, colors: [] as string[], sizes: [] as string[], title: '', description: '' };
  }

  configFor(productId: number) {
    return this.productConfigs()[productId] ?? this.blankConfig();
  }

  patchConfig(productId: number, patch: Partial<ReturnType<DesignerDashboardPageComponent['blankConfig']>>): void {
    const current = this.configFor(productId);
    this.productConfigs.set({ ...this.productConfigs(), [productId]: { ...current, ...patch } });
  }

  /** Predefined colours/sizes for a product (admin-owned, designer picks a subset). */
  productColors(productId: number): string[] {
    return this.workflow.getProductById(productId)?.colors ?? [];
  }
  productSizes(productId: number): string[] {
    return this.workflow.getProductById(productId)?.sizes ?? [];
  }

  toggleProduct(productId: number, checked: boolean): void {
    if (checked) {
      // Default to ALL predefined colours/sizes; the designer can narrow them.
      this.patchConfig(productId, {
        selected: true,
        colors: this.configFor(productId).colors.length ? this.configFor(productId).colors : this.productColors(productId),
        sizes: this.configFor(productId).sizes.length ? this.configFor(productId).sizes : this.productSizes(productId),
      });
    } else {
      this.patchConfig(productId, { selected: false });
    }
  }

  toggleConfigColor(productId: number, color: string): void {
    const c = this.configFor(productId);
    const set = new Set(c.colors);
    if (set.has(color)) set.delete(color);
    else set.add(color);
    this.patchConfig(productId, { colors: [...set] });
  }

  toggleConfigSize(productId: number, size: string): void {
    const c = this.configFor(productId);
    const set = new Set(c.sizes);
    if (set.has(size)) set.delete(size);
    else set.add(size);
    this.patchConfig(productId, { sizes: [...set] });
  }

  readonly selectedProductIds = computed(() =>
    Object.entries(this.productConfigs())
      .filter(([, c]) => c.selected)
      .map(([id]) => Number(id)),
  );

  goToStep2(): void {
    const f = this.designForm();
    if (!f.image) {
      this.uploadError.set('Please upload your artwork before continuing.');
      return;
    }
    if (!f.categories.length) {
      this.uploadError.set('Pick at least one category.');
      return;
    }
    this.uploadError.set('');
    this.wizardStep.set(2);
  }

  backToStep1(): void {
    this.wizardStep.set(1);
  }

  publishDesign(): void {
    const user = this.user();
    if (!user) return;
    const f = this.designForm();
    if (!this.selectedProductIds().length) {
      this.uploadError.set('Select at least one product this design can be printed on.');
      this.wizardStep.set(2);
      return;
    }
    const created = this.workflow.addOrUpdateDesign(
      {
        id: f.id || undefined,
        title: f.title,
        image: f.image,
        category: f.categories[0] ?? 'Culture',
        categories: f.categories,
        tags: f.tags,
        description: f.description,
      },
      user.id,
    );
    const ids = this.selectedProductIds();
    this.workflow.assignProductsToDesign(created.id, ids);
    for (const pid of ids) {
      const c = this.configFor(pid);
      this.workflow.saveDesignProductConfiguration(created.id, {
        productId: pid,
        defaultPlacement: { x: c.x, y: c.y, scale: c.scale },
        availableColors: c.colors.length ? c.colors : this.productColors(pid),
        availableSizes: c.sizes.length ? c.sizes : this.productSizes(pid),
        title: c.title.trim() || undefined,
        description: c.description.trim() || undefined,
      });
    }
    // Reset wizard
    this.designForm.set({ id: 0, title: '', image: '', categories: [], tags: [], description: '' });
    this.tagInput.set('');
    this.productConfigs.set({});
    this.wizardStep.set(1);
    this.uploadError.set('');
    this.payoutMsg.set('');
  }

  /** Platform-fixed royalty the designer earns per sale (read-only, spec §5). */
  readonly royaltyPerSale = computed(() => this.workflow.platformSettings().designerRoyalty);
  readonly payoutThreshold = computed(() => this.workflow.platformSettings().payoutThreshold);
  readonly payoutBalance = computed(() => this.user()?.designerProfile?.payoutBalance ?? 0);
  readonly salesScore = computed(() => this.user()?.designerProfile?.salesScore ?? 0);
  readonly level = computed(() => this.user()?.designerRank ?? 'Novice');
  readonly canRequestPayout = computed(() => this.payoutBalance() >= this.payoutThreshold());
  readonly payoutMsg = signal('');

  requestPayout(): void {
    const user = this.user();
    if (!user) return;
    const res = this.workflow.requestDesignerPayout(user.id);
    this.payoutMsg.set(res.success ? 'Payout requested. It will be processed within 7 days.' : res.error ?? 'Unable to request payout.');
  }

  readonly profileLinks = signal((this.user()?.designerProfile?.portfolioLinks ?? []).map((l) => l.url).join('\n'));

  /** Load an existing design into the wizard for editing. */
  editDesign(designId: number): void {
    const design = this.designs().find((d) => d.id === designId);
    if (!design) return;
    this.designForm.set({
      id: design.id,
      title: design.title,
      image: design.image,
      categories: design.categories?.length ? design.categories : design.category ? [design.category] : [],
      tags: design.tags ?? [],
      description: design.description,
    });
    this.tagInput.set('');
    const configs: Record<number, ReturnType<DesignerDashboardPageComponent['blankConfig']>> = {};
    for (const pid of design.assignedProductIds) {
      const cfg = design.productConfigurations.find((c) => c.productId === pid);
      configs[pid] = {
        selected: true,
        x: cfg?.defaultPlacement.x ?? 50,
        y: cfg?.defaultPlacement.y ?? 48,
        scale: cfg?.defaultPlacement.scale ?? 0.42,
        colors: cfg?.availableColors ?? this.workflow.getProductById(pid)?.colors ?? [],
        sizes: cfg?.availableSizes ?? this.workflow.getProductById(pid)?.sizes ?? [],
        title: cfg?.title ?? '',
        description: cfg?.description ?? '',
      };
    }
    this.productConfigs.set(configs);
    this.activeTab.set('designs');
    this.wizardStep.set(1);
    this.uploadError.set('');
  }

  /** Step 1: validate the artwork is ≤ 1 MB before accepting it. */
  async onDesignFileChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > this.MAX_IMAGE_BYTES) {
      this.uploadError.set(`Image is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum is 1 MB.`);
      this.designForm.set({ ...this.designForm(), image: '' });
      return;
    }
    this.uploadError.set('');
    const result = await readFileAsDataUrl(file);
    this.designForm.set({ ...this.designForm(), image: result });
  }

  toggleArchive(designId: number, archived: boolean): void {
    this.workflow.setDesignStatus(designId, archived ? 'ACTIVE' : 'ARCHIVED');
  }

  saveProfile(): void {
    this.auth.updateDesignerProfile({
      portfolioLinks: this.profileLinks()
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, i) => ({ id: `link-${i}`, label: `Link ${i + 1}`, url })),
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
