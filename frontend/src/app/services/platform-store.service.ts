import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { demoAccounts, designCategories, seedDesigns, seedOrders, seedPayouts, seedPrinters, seedProducts, seedReviews, seedUsers } from '../data/mock';
import type {
  Address,
  AnalyticsPoint,
  Cart,
  CartItem,
  CartItemPayload,
  CartLineView,
  CustomerProfile,
  CustomizationDraft,
  Design,
  DesignAnalytics,
  DesignProductConfiguration,
  DesignerProfile,
  DesignerRank,
  Order,
  OrderLine,
  OrderLineStatus,
  PayoutRecord,
  PaymentMethod,
  PaymentPreference,
  PlaceOrderPayload,
  PrinterPartner,
  PrinterProfile,
  PrinterRank,
  Product,
  Review,
  ReviewPayload,
  User,
  UserRole,
} from '../models/types';
import { ApiService } from './api.service';

const STORAGE_KEY = 'printymand_platform_state_v3';

interface StoredCredential {
  email: string;
  password: string;
  userId: number;
}

interface PlatformState {
  backendMode: 'mock' | 'hybrid' | 'api';
  currentUserId: number | null;
  nextId: number;
  users: User[];
  credentials: StoredCredential[];
  printers: PrinterPartner[];
  products: Product[];
  designs: Design[];
  cartItems: CartItem[];
  orders: Order[];
  reviews: Review[];
  payouts: PayoutRecord[];
  customizationDraft: CustomizationDraft | null;
}

type AddressInput = Omit<Address, 'id'> & Partial<Pick<Address, 'id'>>;
type PaymentPreferenceInput = Omit<PaymentPreference, 'id'> & Partial<Pick<PaymentPreference, 'id'>>;

@Injectable({ providedIn: 'root' })
export class PlatformStoreService {
  private readonly api = inject(ApiService);
  private readonly state = signal<PlatformState>(this.readState());

  readonly backendMode = computed(() => this.state().backendMode);
  readonly currentUser = computed(() => this.state().users.find((user) => user.id === this.state().currentUserId) ?? null);
  readonly users = computed(() => this.state().users);
  readonly designs = computed(() => this.state().designs);
  readonly products = computed(() => this.state().products);
  readonly printers = computed(() => this.state().printers);
  readonly orders = computed(() => this.state().orders);
  readonly reviews = computed(() => this.state().reviews);
  readonly payouts = computed(() => this.state().payouts);
  readonly customizationDraft = computed(() => this.state().customizationDraft);
  readonly categories = computed(() => designCategories.slice());
  readonly currentCart = computed(() => {
    const currentUser = this.currentUser();
    return currentUser ? this.cartForUser(currentUser.id) : { items: [], total: 0 };
  });
  readonly currentUserOrders = computed(() => {
    const currentUser = this.currentUser();
    return currentUser ? this.ordersForCustomer(currentUser.id) : [];
  });
  readonly currentUserReviews = computed(() => {
    const currentUser = this.currentUser();
    return currentUser ? this.reviewsForCustomer(currentUser.id) : [];
  });

  constructor() {
    effect(() => {
      this.persistState(this.state());
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.api.login({ email, password });
      if (response.user) {
        this.syncApiUser(response.user);
        this.patchState({ currentUserId: response.user.id, backendMode: 'api' });
        return { success: true };
      }
    } catch {
      this.patchState({ backendMode: 'hybrid' });
    }

    const credential = this.state().credentials.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase());
    if (!credential || credential.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const user = this.getUserById(credential.userId);
    if (!user) {
      return { success: false, error: 'Account data is unavailable. Please refresh and try again.' };
    }
    if (user.suspended) {
      return { success: false, error: 'This account is suspended. Contact Printymand support.' };
    }

    this.patchState({ currentUserId: user.id });
    return { success: true };
  }

  async register(input: {
    name: string;
    email: string;
    password: string;
    role: Extract<UserRole, 'customer' | 'designer' | 'printer'>;
    address: string;
  }): Promise<{ success: boolean; error?: string }> {
    const exists = this.state().credentials.some((entry) => entry.email.toLowerCase() === input.email.trim().toLowerCase());
    if (exists) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    try {
      await this.api.register({
        name: input.name,
        email: input.email,
        password: input.password,
        address: input.address,
        role: input.role,
      });
      this.patchState({ backendMode: 'hybrid' });
    } catch {
      this.patchState({ backendMode: 'hybrid' });
    }

    const userId = this.takeNextId();
    const createdUser = createUserForRole({
      id: userId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      address: input.address.trim(),
      role: input.role,
    });
    const nextPrinter = input.role === 'printer' ? createPrinterPartner({ id: this.takeNextId(), user: createdUser }) : null;

    this.state.update((current) => ({
      ...current,
      currentUserId: createdUser.id,
      users: [createdUser, ...current.users],
      credentials: [...current.credentials, { email: createdUser.email, password: input.password, userId: createdUser.id }],
      printers: nextPrinter ? [nextPrinter, ...current.printers] : current.printers,
    }));

    return { success: true };
  }

  async logout(): Promise<void> {
    try {
      await this.api.logout();
    } catch {
      this.patchState({ backendMode: 'hybrid' });
    }
    this.patchState({ currentUserId: null });
  }

  updateUserBasics(userId: number, updates: Partial<Pick<User, 'name' | 'email' | 'address' | 'avatar'>>): void {
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, ...updates } : user)),
      credentials: current.credentials.map((entry) =>
        entry.userId === userId && updates.email ? { ...entry, email: updates.email.trim().toLowerCase() } : entry,
      ),
      printers: current.printers.map((printer) =>
        printer.userId === userId
          ? {
              ...printer,
              businessName: updates.name ?? printer.businessName,
            }
          : printer,
      ),
      designs: current.designs.map((design) =>
        design.designerId === userId
          ? {
              ...design,
              designer: updates.name ?? design.designer,
              designerAvatar: updates.avatar ?? design.designerAvatar,
            }
          : design,
      ),
    }));
  }

  saveCustomerProfile(userId: number, updates: Partial<CustomerProfile>): void {
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              customerProfile: {
                ...createDefaultCustomerProfile(user),
                ...user.customerProfile,
                ...updates,
              },
            }
          : user,
      ),
    }));
  }

  saveDesignerProfile(userId: number, updates: Partial<DesignerProfile>): void {
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              designerProfile: {
                ...createDefaultDesignerProfile(user),
                ...user.designerProfile,
                ...updates,
              },
            }
          : user,
      ),
    }));
  }

  savePrinterProfile(userId: number, updates: Partial<PrinterProfile>): void {
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              printerProfile: {
                ...createDefaultPrinterProfile(user),
                ...user.printerProfile,
                ...updates,
              },
            }
          : user,
      ),
      printers: current.printers.map((printer) =>
        printer.userId === userId
          ? {
              ...printer,
              businessName: updates.businessName ?? printer.businessName,
              location: updates.governorate ?? updates.location ?? printer.location,
            }
          : printer,
      ),
    }));
  }

  upsertAddress(userId: number, input: AddressInput): void {
    const nextAddressId = input.id ?? this.takeNextId();
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) => {
        if (user.id !== userId) return user;
        const profile = {
          ...createDefaultCustomerProfile(user),
          ...user.customerProfile,
        };
        const nextAddress: Address = {
          id: nextAddressId,
          label: input.label,
          recipient: input.recipient,
          line1: input.line1,
          city: input.city,
          governorate: input.governorate,
          postalCode: input.postalCode,
          phone: input.phone,
          isDefault: !!input.isDefault || !profile.savedAddresses.length,
        };

        const existing = profile.savedAddresses.filter((address) => address.id !== nextAddress.id);
        const savedAddresses = (nextAddress.isDefault
          ? existing.map((address) => ({ ...address, isDefault: false }))
          : existing
        ).concat(nextAddress);

        return {
          ...user,
          customerProfile: {
            ...profile,
            savedAddresses,
          },
        };
      }),
    }));
  }

  removeAddress(userId: number, addressId: number): void {
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) => {
        if (user.id !== userId || !user.customerProfile) return user;
        const remaining = user.customerProfile.savedAddresses.filter((address) => address.id !== addressId);
        return {
          ...user,
          customerProfile: {
            ...user.customerProfile,
            savedAddresses: remaining.map((address, index) => ({
              ...address,
              isDefault: index === 0 ? true : address.isDefault,
            })),
          },
        };
      }),
    }));
  }

  upsertPaymentPreference(userId: number, input: PaymentPreferenceInput): void {
    const nextPreferenceId = input.id ?? `pref-${this.takeNextId()}`;
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) => {
        if (user.id !== userId) return user;
        const profile = { ...createDefaultCustomerProfile(user), ...user.customerProfile };
        const nextPreference: PaymentPreference = {
          id: nextPreferenceId,
          label: input.label,
          provider: input.provider,
          details: input.details,
          enabled: input.enabled,
          isDefault: !!input.isDefault || !profile.paymentPreferences.length,
        };
        const existing = profile.paymentPreferences.filter((preference) => preference.id !== nextPreference.id);
        const paymentPreferences = (nextPreference.isDefault
          ? existing.map((preference) => ({ ...preference, isDefault: false }))
          : existing
        ).concat(nextPreference);

        return {
          ...user,
          customerProfile: {
            ...profile,
            paymentPreferences,
          },
        };
      }),
    }));
  }

  updateUserRole(userId: number, role: UserRole): void {
    this.state.update((current) => {
      const updatedUsers = current.users.map((user) => {
        if (user.id !== userId) return user;
        return ensureRoleDefaults({ ...user, role });
      });
      const updatedUser = updatedUsers.find((user) => user.id === userId);
      const existingPrinter = current.printers.find((printer) => printer.userId === userId);
      const shouldCreatePrinter = role === 'printer' && updatedUser && !existingPrinter;
      const nextPrinterId = shouldCreatePrinter ? current.nextId + 1 : current.nextId;

      return {
        ...current,
        nextId: nextPrinterId,
        users: updatedUsers,
        printers:
          role === 'printer' && updatedUser
            ? existingPrinter
              ? current.printers
              : [...current.printers, createPrinterPartner({ id: nextPrinterId, user: updatedUser })]
            : current.printers.filter((printer) => printer.userId !== userId),
      };
    });
  }

  updateDesignerRank(userId: number, rank: DesignerRank): void {
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, designerRank: rank } : user)),
      designs: current.designs.map((design) => (design.designerId === userId ? { ...design, designerRank: rank } : design)),
    }));
  }

  updatePrinterRank(userId: number, rank: PrinterRank): void {
    this.state.update((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, printerRank: rank } : user)),
      printers: current.printers.map((printer) => {
        const printerUser = current.users.find((user) => user.id === printer.userId);
        return printer.userId === userId || printerUser?.id === userId ? { ...printer, rank } : printer;
      }),
    }));
  }

  toggleUserSuspended(userId: number): void {
    this.state.update((current) => ({
      ...current,
      currentUserId: current.currentUserId === userId ? null : current.currentUserId,
      users: current.users.map((user) => (user.id === userId ? { ...user, suspended: !user.suspended } : user)),
    }));
  }

  setCustomizationDraft(draft: CustomizationDraft): void {
    this.patchState({ customizationDraft: draft });
  }

  clearCustomizationDraft(): void {
    this.patchState({ customizationDraft: null });
  }

  createCartPayloadFromDraft(draft: CustomizationDraft): CartItemPayload {
    return {
      design: {
        id: draft.designId,
        x: draft.placement.x,
        y: draft.placement.y,
        scale: draft.placement.scale,
      },
      product: {
        id: draft.productId,
        color: draft.selectedColor,
      },
    };
  }

  async addDraftToCart(userId: number): Promise<{ success: boolean; error?: string }> {
    const draft = this.state().customizationDraft;
    if (!draft) return { success: false, error: 'No customization draft is available.' };
    if (!draft.selectedPrinterId) return { success: false, error: 'Select a printer before adding to cart.' };

    try {
      await this.api.addToCart(this.createCartPayloadFromDraft(draft));
      this.patchState({ backendMode: 'hybrid' });
    } catch {
      this.patchState({ backendMode: 'hybrid' });
    }

    const nextCartItem: CartItem = {
      id: this.takeNextId(),
      userId,
      designId: draft.designId,
      productId: draft.productId,
      printerId: draft.selectedPrinterId,
      color: draft.selectedColor,
      size: draft.selectedSize,
      x: draft.placement.x,
      y: draft.placement.y,
      scale: draft.placement.scale,
      createdAt: new Date().toISOString(),
    };

    this.state.update((current) => ({
      ...current,
      cartItems: [nextCartItem, ...current.cartItems],
      customizationDraft: null,
    }));

    return { success: true };
  }

  removeCartItem(userId: number, cartItemId: number): void {
    this.state.update((current) => ({
      ...current,
      cartItems: current.cartItems.filter((item) => !(item.userId === userId && item.id === cartItemId)),
    }));
  }

  async placeOrder(userId: number, payload: PlaceOrderPayload): Promise<Order | null> {
    const cart = this.cartForUser(userId);
    if (!cart.items.length) return null;

    const orderId = `PMD-${Date.now()}`;
    try {
      const response = await this.api.placeOrder(payload);
      this.patchState({ backendMode: 'hybrid' });
      const normalizedOrderId = response.orderId ?? orderId;
      return this.finalizeLocalOrder(userId, payload, normalizedOrderId);
    } catch {
      this.patchState({ backendMode: 'hybrid' });
      return this.finalizeLocalOrder(userId, payload, orderId);
    }
  }

  async startPayment(orderId: number | string): Promise<string> {
    try {
      const response = await this.api.initiatePayment(orderId);
      this.markOrderPaymentStatus(orderId, 'processing');
      return response.paymentUrl;
    } catch {
      this.patchState({ backendMode: 'hybrid' });
      this.markOrderPaymentStatus(orderId, 'paid');
      return `/tracking/${orderId}?payment=paid`;
    }
  }

  markOrderPaymentStatus(orderId: number | string, status: 'processing' | 'paid'): void {
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((order) => (order.id === orderId ? { ...order, paymentStatus: status } : order)),
    }));
  }

  async submitReview(orderId: number | string, customerId: number, review: ReviewPayload): Promise<{ success: boolean; error?: string }> {
    if (this.state().reviews.some((entry) => entry.orderId === orderId && entry.customerId === customerId)) {
      return { success: false, error: 'A review has already been submitted for this order.' };
    }

    try {
      await this.api.submitReview(orderId, review);
      this.patchState({ backendMode: 'hybrid' });
    } catch {
      this.patchState({ backendMode: 'hybrid' });
    }

    const nextReview: Review = {
      id: this.takeNextId(),
      orderId,
      customerId,
      rating: review.rating,
      comment: review.comment.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    this.state.update((current) => ({
      ...current,
      reviews: [nextReview, ...current.reviews],
    }));

    return { success: true };
  }

  addOrUpdateDesign(input: Partial<Design> & Pick<Design, 'title' | 'image' | 'category' | 'description' | 'price'>, designerId: number): Design {
    const designer = this.getUserById(designerId);
    const existing = input.id ? this.getDesignById(input.id) : null;
    const nextDesign: Design = {
      id: input.id ?? this.takeNextId(),
      title: input.title,
      image: input.image,
      designerId,
      designer: designer?.name ?? 'Unknown designer',
      designerRank: designer?.designerRank ?? 'Novice',
      designerAvatar: designer?.avatar ?? '/placeholder-image.svg',
      category: input.category,
      description: input.description,
      tags: input.tags ?? existing?.tags ?? [],
      rating: existing?.rating ?? 0,
      sales: existing?.sales ?? 0,
      views: existing?.views ?? 0,
      engagementRate: existing?.engagementRate ?? 0,
      conversionRate: existing?.conversionRate ?? 0,
      price: input.price,
      status: input.status ?? existing?.status ?? 'ACTIVE',
      assignedProductIds: input.assignedProductIds ?? existing?.assignedProductIds ?? [],
      productConfigurations: input.productConfigurations ?? existing?.productConfigurations ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    this.state.update((current) => ({
      ...current,
      designs: existing
        ? current.designs.map((design) => (design.id === nextDesign.id ? nextDesign : design))
        : [nextDesign, ...current.designs],
    }));

    return nextDesign;
  }

  setDesignStatus(designId: number, status: Design['status']): void {
    this.state.update((current) => ({
      ...current,
      designs: current.designs.map((design) => (design.id === designId ? { ...design, status, updatedAt: new Date().toISOString().slice(0, 10) } : design)),
    }));
  }

  assignProductsToDesign(designId: number, productIds: number[]): void {
    this.state.update((current) => ({
      ...current,
      designs: current.designs.map((design) => (design.id === designId ? { ...design, assignedProductIds: productIds } : design)),
      products: current.products.map((product) => ({
        ...product,
        assignedDesignIds: productIds.includes(product.id)
          ? Array.from(new Set([...product.assignedDesignIds, designId]))
          : product.assignedDesignIds.filter((assignedId) => assignedId !== designId),
      })),
    }));
  }

  saveDesignProductConfiguration(designId: number, config: DesignProductConfiguration): void {
    this.state.update((current) => ({
      ...current,
      designs: current.designs.map((design) => {
        if (design.id !== designId) return design;
        const others = design.productConfigurations.filter((entry) => entry.productId !== config.productId);
        return {
          ...design,
          productConfigurations: [...others, config],
        };
      }),
    }));
  }

  addOrUpdateProduct(input: Partial<Product> & Pick<Product, 'name' | 'category' | 'description' | 'basePrice' | 'colors' | 'sizes' | 'images' | 'availability' | 'leadTimeDays'>, printerUserId: number): Product {
    const printerPartner = this.getPrinterByUserId(printerUserId);
    const printerUser = this.getUserById(printerUserId);
    const createdPrinter = !printerPartner && printerUser ? createPrinterPartner({ id: this.takeNextId(), user: printerUser }) : null;
    const resolvedPrinter = printerPartner ?? createdPrinter;
    const existing = input.id ? this.getProductById(input.id) : null;
    const nextProduct: Product = {
      id: input.id ?? this.takeNextId(),
      printerId: resolvedPrinter?.id ?? 0,
      printerName: resolvedPrinter?.businessName ?? printerUser?.name ?? 'Printer',
      name: input.name,
      category: input.category,
      description: input.description,
      basePrice: input.basePrice,
      colors: input.colors,
      sizes: input.sizes,
      images: input.images,
      availability: input.availability,
      leadTimeDays: input.leadTimeDays,
      rating: existing?.rating ?? 0,
      totalOrders: existing?.totalOrders ?? 0,
      assignedDesignIds: input.assignedDesignIds ?? existing?.assignedDesignIds ?? [],
    };

    this.state.update((current) => ({
      ...current,
      printers: createdPrinter ? [createdPrinter, ...current.printers] : current.printers,
      products: existing
        ? current.products.map((product) => (product.id === nextProduct.id ? nextProduct : product))
        : [nextProduct, ...current.products],
    }));

    return nextProduct;
  }

  setOrderLineStatus(orderId: number | string, lineId: number, status: OrderLineStatus): void {
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              lines: order.lines.map((line) => (line.id === lineId ? { ...line, status } : line)),
            }
          : order,
      ),
    }));
  }

  advanceOrderLineStatus(orderId: number | string, lineId: number): void {
    const steps: OrderLineStatus[] = ['Pending', 'Accepted', 'Printing', 'Shipped', 'Delivered'];
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              lines: order.lines.map((line) => {
                if (line.id !== lineId || line.status === 'Rejected') return line;
                const index = steps.indexOf(line.status);
                return {
                  ...line,
                  status: index === -1 || index === steps.length - 1 ? line.status : steps[index + 1],
                };
              }),
            }
          : order,
      ),
    }));
  }

  getUserById(userId: number): User | undefined {
    return this.state().users.find((user) => user.id === userId);
  }

  getDesignById(designId: number | string): Design | undefined {
    return this.state().designs.find((design) => design.id === Number(designId));
  }

  getProductById(productId: number | string): Product | undefined {
    return this.state().products.find((product) => product.id === Number(productId));
  }

  getPrinterById(printerId: number | string): PrinterPartner | undefined {
    return this.state().printers.find((printer) => printer.id === Number(printerId));
  }

  getPrinterByUserId(userId: number): PrinterPartner | undefined {
    return this.state().printers.find((printer) => printer.userId === userId);
  }

  getOrderById(orderId: number | string): Order | undefined {
    return this.state().orders.find((order) => String(order.id) === String(orderId));
  }

  getDesignConfig(designId: number, productId: number): DesignProductConfiguration | undefined {
    return this.getDesignById(designId)?.productConfigurations.find((config) => config.productId === productId);
  }

  designsForDesigner(designerId: number): Design[] {
    return this.state().designs.filter((design) => design.designerId === designerId);
  }

  productsForPrinterUser(printerUserId: number): Product[] {
    const printer = this.getPrinterByUserId(printerUserId);
    return printer ? this.state().products.filter((product) => product.printerId === printer.id) : [];
  }

  ordersForCustomer(userId: number): Order[] {
    return this.state().orders.filter((order) => order.userId === userId).sort(sortByDateDesc);
  }

  reviewsForCustomer(userId: number): Review[] {
    return this.state().reviews.filter((review) => review.customerId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  linesForPrinterUser(printerUserId: number): Array<OrderLine & { orderId: number | string; customer: User | undefined }> {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return [];
    return this.state().orders.flatMap((order) =>
      order.lines
        .filter((line) => line.printerId === printer.id)
        .map((line) => ({
          ...line,
          orderId: order.id,
          customer: this.getUserById(order.userId),
        })),
    );
  }

  linesForDesigner(designerId: number): Array<OrderLine & { orderId: number | string }> {
    const designIds = new Set(this.designsForDesigner(designerId).map((design) => design.id));
    return this.state().orders.flatMap((order) =>
      order.lines.filter((line) => designIds.has(line.designId)).map((line) => ({ ...line, orderId: order.id })),
    );
  }

  cartForUser(userId: number): Cart {
    const items: CartLineView[] = this.state()
      .cartItems.filter((item) => item.userId === userId)
      .map((item) => {
        const design = this.getDesignById(item.designId);
        const product = this.getProductById(item.productId);
        if (!design || !product) return null;
        const printer = item.printerId ? this.getPrinterById(item.printerId) ?? null : null;
        const lineTotal = design.price + product.basePrice + (printer ? Math.round(product.basePrice * 0.18) : 0);
        return {
          id: item.id,
          design,
          product,
          printer,
          color: item.color,
          size: item.size,
          placement: {
            x: item.x,
            y: item.y,
            scale: item.scale,
          },
          lineTotal,
        };
      })
      .filter((item): item is CartLineView => item !== null);

    return {
      items,
      total: items.reduce((sum, item) => sum + item.lineTotal, 0),
    };
  }

  getOrderStatus(order: Order): OrderLineStatus {
    const statuses = order.lines.map((line) => line.status);
    if (statuses.every((status) => status === 'Rejected')) return 'Rejected';
    if (statuses.every((status) => status === 'Delivered')) return 'Delivered';
    if (statuses.some((status) => status === 'Shipped')) return 'Shipped';
    if (statuses.some((status) => status === 'Printing')) return 'Printing';
    if (statuses.some((status) => status === 'Accepted')) return 'Accepted';
    return 'Pending';
  }

  buildOrderTimeline(order: Order): Array<{ label: string; done: boolean }> {
    const status = this.getOrderStatus(order);
    const orderSteps: OrderLineStatus[] = ['Pending', 'Accepted', 'Printing', 'Shipped', 'Delivered'];
    const activeIndex = orderSteps.indexOf(status);
    return orderSteps.map((label, index) => ({ label, done: index <= activeIndex }));
  }

  designerAnalytics(designerId: number): DesignAnalytics[] {
    const lines = this.linesForDesigner(designerId);
    return this.designsForDesigner(designerId).map((design) => {
      const designLines = lines.filter((line) => line.designId === design.id && line.status !== 'Rejected');
      const revenue = designLines.reduce((sum, line) => sum + line.price * 0.28, 0);
      return {
        designId: design.id,
        sales: designLines.length,
        views: design.views,
        engagement: design.engagementRate,
        conversion: design.conversionRate,
        revenue,
        trend: buildTrend(design.sales, design.views),
      };
    });
  }

  designerTotals(designerId: number): { earnings: number; designs: number; orders: number; avgConversion: number } {
    const analytics = this.designerAnalytics(designerId);
    return {
      earnings: analytics.reduce((sum, entry) => sum + entry.revenue, 0),
      designs: analytics.length,
      orders: analytics.reduce((sum, entry) => sum + entry.sales, 0),
      avgConversion: analytics.length ? analytics.reduce((sum, entry) => sum + entry.conversion, 0) / analytics.length : 0,
    };
  }

  printerTotals(printerUserId: number): { products: number; revenue: number; fulfillmentRate: number; rating: number } {
    const printer = this.getPrinterByUserId(printerUserId);
    const products = this.productsForPrinterUser(printerUserId);
    const lines = this.linesForPrinterUser(printerUserId).filter((line) => line.status !== 'Rejected');
    return {
      products: products.length,
      revenue: lines.reduce((sum, line) => sum + line.price, 0),
      fulfillmentRate: printer?.fulfillmentRate ?? 0,
      rating: printer?.rating ?? 0,
    };
  }

  adminOverview(): { users: number; orders: number; revenue: number; activeDesigns: number; activePrinters: number } {
    return {
      users: this.state().users.length,
      orders: this.state().orders.length,
      revenue: this.state().orders.reduce((sum, order) => sum + order.total, 0),
      activeDesigns: this.state().designs.filter((design) => design.status === 'ACTIVE').length,
      activePrinters: this.state().printers.length,
    };
  }

  availableProductsForDesign(designId: number): Product[] {
    const design = this.getDesignById(designId);
    if (!design) return [];
    return this.state().products.filter((product) => design.assignedProductIds.includes(product.id));
  }

  availableDesignsForProduct(productId: number): Design[] {
    return this.state().designs.filter((design) => design.assignedProductIds.includes(Number(productId)) && design.status === 'ACTIVE');
  }

  private finalizeLocalOrder(userId: number, payload: PlaceOrderPayload, orderId: number | string): Order {
    const cartItems = this.state().cartItems.filter((item) => item.userId === userId);
    const user = this.getUserById(userId);
    const shippingAddress = payload.shippingAddress || user?.customerProfile?.savedAddresses.find((address) => address.isDefault)?.line1 || user?.address || '';
    const lines: OrderLine[] = cartItems
      .map((item) => {
        const design = this.getDesignById(item.designId);
        const product = this.getProductById(item.productId);
        const printer = item.printerId ? this.getPrinterById(item.printerId) : null;
        if (!design || !product) return null;
        return {
          id: this.takeNextId(),
          designId: design.id,
          designTitle: design.title,
          designImage: design.image,
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] ?? '/placeholder-image.svg',
          printerId: printer?.id ?? null,
          printerName: printer?.businessName ?? 'Pending printer',
          color: item.color,
          size: item.size,
          x: item.x,
          y: item.y,
          scale: item.scale,
          price: design.price + product.basePrice + (printer ? Math.round(product.basePrice * 0.18) : 0),
          status: 'Pending',
        };
      })
      .filter((line): line is OrderLine => !!line);

    const createdOrder: Order = {
      id: orderId,
      userId,
      createdAt: new Date().toISOString().slice(0, 10),
      trackingCode: `PMD-${String(orderId).slice(-6)}`,
      total: lines.reduce((sum, line) => sum + line.price, 0),
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === 'cash' ? 'pending' : 'processing',
      shippingAddress,
      lines,
    };

    this.state.update((current) => ({
      ...current,
      orders: [createdOrder, ...current.orders],
      cartItems: current.cartItems.filter((item) => item.userId !== userId),
    }));

    return createdOrder;
  }

  private syncApiUser(apiUser: NonNullable<Awaited<ReturnType<ApiService['getMe']>>>): void {
    this.state.update((current) => {
      const existing = current.users.find((user) => user.id === apiUser.id);
      const nextUser = ensureRoleDefaults({
        ...(existing ?? createUserForRole({ id: apiUser.id, name: apiUser.name, email: apiUser.email, address: apiUser.address ?? '', role: normalizeRole(apiUser.role) })),
        name: apiUser.name,
        email: apiUser.email,
        address: apiUser.address ?? existing?.address ?? '',
        avatar: apiUser.avatar ?? existing?.avatar,
        role: normalizeRole(apiUser.role),
      });

      return {
        ...current,
        users: existing ? current.users.map((user) => (user.id === apiUser.id ? nextUser : user)) : [nextUser, ...current.users],
      };
    });
  }

  private patchState(partial: Partial<PlatformState>): void {
    this.state.update((current) => ({ ...current, ...partial }));
  }

  private takeNextId(): number {
    const nextId = this.state().nextId + 1;
    this.patchState({ nextId });
    return nextId;
  }

  private readState(): PlatformState {
    const fallback: PlatformState = {
      backendMode: 'mock',
      currentUserId: null,
      nextId: 10000,
      users: seedUsers.map((user) => ensureRoleDefaults(user)),
      credentials: demoAccounts.map((account) => {
        const user = seedUsers.find((candidate) => candidate.email === account.email)!;
        return {
          email: account.email,
          password: account.password,
          userId: user.id,
        };
      }),
      printers: seedPrinters,
      products: seedProducts,
      designs: seedDesigns,
      cartItems: [],
      orders: seedOrders,
      reviews: seedReviews,
      payouts: seedPayouts,
      customizationDraft: null,
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as PlatformState;
      return {
        ...fallback,
        ...parsed,
        users: Array.isArray(parsed.users) ? parsed.users.map((user) => ensureRoleDefaults(user)) : fallback.users,
      };
    } catch {
      return fallback;
    }
  }

  private persistState(state: PlatformState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function createUserForRole(input: {
  id: number;
  name: string;
  email: string;
  address: string;
  role: UserRole;
}): User {
  return ensureRoleDefaults({
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    address: input.address,
    joinDate: new Date().toISOString().slice(0, 10),
    avatar: seedUsers[0]?.avatar ?? '/placeholder-image.svg',
  });
}

function ensureRoleDefaults(user: User): User {
  const baseUser: User = {
    ...user,
    customerProfile: user.role === 'customer' ? { ...createDefaultCustomerProfile(user), ...user.customerProfile } : user.customerProfile,
    designerProfile: user.role === 'designer' ? { ...createDefaultDesignerProfile(user), ...user.designerProfile } : user.designerProfile,
    printerProfile: user.role === 'printer' ? { ...createDefaultPrinterProfile(user), ...user.printerProfile } : user.printerProfile,
  };

  if (baseUser.role === 'designer') {
    return { ...baseUser, designerRank: baseUser.designerRank ?? 'Novice' };
  }
  if (baseUser.role === 'printer') {
    return { ...baseUser, printerRank: baseUser.printerRank ?? 'Verified' };
  }
  return baseUser;
}

function createDefaultCustomerProfile(user: User) {
  return {
    phone: '',
    savedAddresses: user.address
      ? [
          {
            id: user.id * 10,
            label: 'Primary',
            recipient: user.name,
            line1: user.address,
            city: 'Tunis',
            governorate: 'Tunis',
            postalCode: '1000',
            phone: '',
            isDefault: true,
          },
        ]
      : [],
    paymentPreferences: [],
    favoritePrinterIds: [],
    notes: '',
  };
}

function createDefaultDesignerProfile(user: User): DesignerProfile {
  return {
    bio: '',
    banner: user.avatar ?? '/placeholder-image.svg',
    payoutAccount: '',
    profilePicture: user.avatar ?? '/placeholder-image.svg',
    portfolioLinks: [],
  };
}

function createDefaultPrinterProfile(user: User): PrinterProfile {
  return {
    businessName: user.name,
    contactEmail: user.email,
    contactPhone: '',
    location: user.address,
    governorate: 'Tunis',
    about: '',
    productionMethods: [],
    coverageZones: [],
  };
}

function normalizeRole(role: string): UserRole {
  if (role === 'designer' || role === 'printer' || role === 'admin') return role;
  return 'customer';
}

function createPrinterPartner(input: { id: number; user: User }): PrinterPartner {
  return {
    id: input.id,
    userId: input.user.id,
    businessName: input.user.printerProfile?.businessName ?? input.user.name,
    rank: input.user.printerRank ?? 'Verified',
    rating: 4.5,
    reviews: 0,
    fulfillmentRate: 92,
    revenue: 0,
    deliveryDays: 3,
    location: input.user.printerProfile?.governorate ?? 'Tunis',
    images: [input.user.avatar ?? '/placeholder-image.svg'],
  };
}

function buildTrend(sales: number, views: number): AnalyticsPoint[] {
  return [
    { label: 'W1', value: Math.max(1, Math.round(sales * 0.18)) },
    { label: 'W2', value: Math.max(2, Math.round(sales * 0.22)) },
    { label: 'W3', value: Math.max(2, Math.round(sales * 0.26)) },
    { label: 'W4', value: Math.max(3, Math.round(sales * 0.34 + views * 0.001)) },
  ];
}

function sortByDateDesc(a: Order, b: Order): number {
  return b.createdAt.localeCompare(a.createdAt);
}
