import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { demoAccounts, seedDesigns, seedOfferings, seedOrders, seedPayouts, seedPrinters, seedProducts, seedReviews, seedUsers } from '../data/mock';
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
  AccountStatus,
  AppNotification,
  FeaturedContent,
  ModerationLogEntry,
  NotificationType,
  Order,
  OrderLine,
  OrderLineStatus,
  PayoutRecord,
  PaymentMethod,
  PaymentPreference,
  PaymentStatus,
  PlaceOrderPayload,
  PlatformSettings,
  PrinterAvailability,
  PrinterPartner,
  PrinterPayoutRecord,
  PrinterProductOffering,
  PrinterProfile,
  PrinterRank,
  Product,
  Review,
  ReviewPayload,
  ReviewTarget,
  User,
  UserRole,
} from '../models/types';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

export const STORAGE_KEY = 'printymand_platform_state_v7';

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  // Spec example: printer 30 TND + platform 10 TND = 40 TND final price.
  margin: 10,
  // Platform-fixed designer royalty per sale (designer cannot change it).
  designerRoyalty: 5,
  // Minimum accrued balance before a designer can request a payout.
  payoutThreshold: 50,
  categories: ['Culture', 'Typography', 'Minimal', 'Nature', 'Streetwear', 'Retro'],
};

const MS_PER_DAY = 86_400_000;
/** Days a designer payout request takes to clear. */
const PAYOUT_TERM_DAYS = 7;
/** Fulfillment score a printer earns per fully delivered order. */
const FULFILLMENT_SCORE_PER_ORDER = 5;

/** Spec "Designer Roles": level auto-derived from cumulative sales score. */
function designerLevelForScore(score: number): DesignerRank {
  if (score >= 120) return 'Elite';
  if (score >= 60) return 'Artisan';
  if (score >= 20) return 'Rising';
  return 'Novice';
}

/** Spec "Printer roles": level auto-derived from fulfillment score. */
function printerLevelForScore(score: number): PrinterRank {
  if (score >= 120) return 'Premium';
  if (score >= 50) return 'Gold';
  return 'Verified';
}

/**
 * Local credential record for the offline demo store.
 *
 * NOTE: this is NOT a security control. The digest below only avoids keeping
 * readable passwords in localStorage; anything derived in the browser can be
 * recomputed by the browser. Real authentication must live behind the backend
 * (`environment.useRealApi = true`), which is the only mode that should ever be
 * used with real user accounts.
 */
interface StoredCredential {
  email: string;
  passwordHash: string;
  userId: number;
}

/** Non-cryptographic digest (FNV-1a) — see the StoredCredential note above. */
function digestPassword(password: string): string {
  let hash = 0x811c9dc5;
  const salted = `printymand::${password}`;
  for (let i = 0; i < salted.length; i++) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * How the store last interacted with the backend.
 * - `mock`   — `environment.useRealApi` is false; no HTTP is attempted.
 * - `api`    — the last backend call succeeded.
 * - `hybrid` — the backend is enabled but unreachable/failing; serving local state.
 */
type BackendMode = 'mock' | 'hybrid' | 'api';

export interface PlatformState {
  backendMode: BackendMode;
  currentUserId: number | null;
  nextId: number;
  users: User[];
  credentials: StoredCredential[];
  printers: PrinterPartner[];
  products: Product[];
  offerings: PrinterProductOffering[];
  designs: Design[];
  cartItems: CartItem[];
  orders: Order[];
  reviews: Review[];
  payouts: PayoutRecord[];
  printerPayouts: PrinterPayoutRecord[];
  notifications: AppNotification[];
  featured: FeaturedContent[];
  moderationLog: ModerationLogEntry[];
  customizationDraft: CustomizationDraft | null;
  platformSettings: PlatformSettings;
}

type AddressInput = Omit<Address, 'id'> & Partial<Pick<Address, 'id'>>;
type PaymentPreferenceInput = Omit<PaymentPreference, 'id'> & Partial<Pick<PaymentPreference, 'id'>>;

@Injectable({ providedIn: 'root' })
export class PlatformStoreService {
  private readonly api = inject(ApiService);
  /** Set when localStorage rejects a write (typically the quota). */
  private readonly persistError = signal<string | null>(null);
  private readonly state = signal<PlatformState>(this.readState());

  readonly storageWarning = this.persistError.asReadonly();
  readonly backendMode = computed(() => this.state().backendMode);
  readonly currentUser = computed(() => this.state().users.find((user) => user.id === this.state().currentUserId) ?? null);
  readonly users = computed(() => this.state().users);
  readonly designs = computed(() => this.state().designs);
  readonly products = computed(() => this.state().products);
  readonly offerings = computed(() => this.state().offerings);
  readonly printers = computed(() => this.state().printers);
  readonly orders = computed(() => this.state().orders);
  readonly reviews = computed(() => this.state().reviews);
  readonly payouts = computed(() => this.state().payouts);
  readonly printerPayouts = computed(() => this.state().printerPayouts);
  readonly notifications = computed(() => this.state().notifications);
  readonly featured = computed(() => this.state().featured);
  readonly moderationLog = computed(() => this.state().moderationLog);
  readonly platformSettings = computed(() => this.state().platformSettings);
  readonly currentUserNotifications = computed(() => {
    const u = this.currentUser();
    return u ? this.state().notifications.filter((n) => n.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  });
  readonly currentAwaitingPaymentOrders = computed(() => {
    const u = this.currentUser();
    return u ? this.awaitingPaymentOrdersForUser(u.id) : [];
  });
  readonly customizationDraft = computed(() => this.state().customizationDraft);
  /**
   * The ONE marketplace category list, owned by platform settings and editable
   * by an admin. It contains real categories only — "All" is a UI affordance and
   * must not live in the data.
   */
  readonly categories = computed(() => this.state().platformSettings.categories);
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

  /**
   * Run a backend call when `environment.useRealApi` is on, recording the
   * outcome in `backendMode`. Returns null when the API is disabled or failed,
   * which tells the caller to fall back to purely local state.
   */
  private async tryApi<T>(call: () => Promise<T>): Promise<T | null> {
    if (!environment.useRealApi) return null;
    try {
      const result = await call();
      this.patchState({ backendMode: 'api' });
      return result;
    } catch {
      this.patchState({ backendMode: 'hybrid' });
      return null;
    }
  }

  /** Mirror a local mutation to the backend without blocking the UI. */
  private syncApi(call: () => Promise<unknown>): void {
    void this.tryApi(call);
  }

  /**
   * Gate a sign-in on the account lifecycle. Applied to BOTH the backend and the
   * local credential path so a suspended/banned account can never get a session.
   */
  private accountGate(user: User | undefined): { success: boolean; error?: string } {
    if (!user) {
      return { success: false, error: 'Account data is unavailable. Please refresh and try again.' };
    }
    const status = user.accountStatus ?? (user.suspended ? 'SUSPENDED' : 'ACTIVE');
    if (status === 'SUSPENDED') {
      return { success: false, error: 'This account is suspended. Contact Printymand support.' };
    }
    if (status === 'BANNED') {
      return { success: false, error: 'This account has been banned for policy violations.' };
    }
    return { success: true };
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const response = await this.tryApi(() => this.api.login({ email, password }));
    if (response?.user) {
      this.syncApiUser(response.user);
      const gate = this.accountGate(this.getUserById(response.user.id));
      if (!gate.success) return gate;
      this.patchState({ currentUserId: response.user.id });
      return { success: true };
    }

    const credential = this.state().credentials.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase());
    if (!credential || credential.passwordHash !== digestPassword(password)) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const user = this.getUserById(credential.userId);
    const gate = this.accountGate(user);
    if (!gate.success) return gate;

    this.patchState({ currentUserId: user!.id });
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

    await this.tryApi(() =>
      this.api.register({
        name: input.name,
        email: input.email,
        password: input.password,
        address: input.address,
        role: input.role,
      }),
    );

    const userId = this.takeNextId();
    const createdUser = createUserForRole({
      id: userId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      address: input.address.trim(),
      role: input.role,
      // Spec: admin verifies printer/designer identity at signup. Customers are
      // active immediately; designers/printers start pending verification.
      accountStatus: input.role === 'customer' ? 'ACTIVE' : 'PENDING_VERIFICATION',
    });
    const nextPrinter = input.role === 'printer' ? createPrinterPartner({ id: this.takeNextId(), user: createdUser }) : null;

    this.state.update((current) => ({
      ...current,
      currentUserId: createdUser.id,
      users: [createdUser, ...current.users],
      credentials: [
        ...current.credentials,
        { email: createdUser.email, passwordHash: digestPassword(input.password), userId: createdUser.id },
      ],
      printers: nextPrinter ? [nextPrinter, ...current.printers] : current.printers,
    }));

    return { success: true };
  }

  async logout(): Promise<void> {
    await this.tryApi(() => this.api.logout());
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

  /**
   * Move a user between roles.
   *
   * Demoting a printer retires their PrinterPartner rather than deleting it, so
   * historical order lines and offerings keep resolving. A retired partner is
   * marked unavailable and is filtered out of printer selection.
   */
  updateUserRole(userId: number, role: UserRole): void {
    const existingPrinter = this.getPrinterByUserId(userId);
    // Reserved before the updater; takeNextId() writes to the same signal.
    const newPrinterId = role === 'printer' && !existingPrinter ? this.takeNextId() : null;

    this.state.update((current) => {
      const updatedUsers = current.users.map((user) =>
        user.id === userId ? ensureRoleDefaults({ ...user, role }) : user,
      );
      const updatedUser = updatedUsers.find((user) => user.id === userId);
      if (!updatedUser) return current;

      let printers = current.printers;
      if (role === 'printer') {
        printers = existingPrinter
          ? printers.map((printer) =>
              printer.userId === userId ? { ...printer, retired: false } : printer,
            )
          : [...printers, createPrinterPartner({ id: newPrinterId!, user: updatedUser })];
      } else {
        // Retire instead of removing: orders/offerings still reference this id.
        printers = printers.map((printer) =>
          printer.userId === userId ? { ...printer, retired: true, availability: 'holiday' as const } : printer,
        );
      }

      return { ...current, users: updatedUsers, printers };
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

  /** Admin moves an account through the verification lifecycle. */
  setAccountStatus(userId: number, status: AccountStatus): void {
    this.syncApi(() => this.api.setAccountStatus(userId, status));
    this.state.update((current) => ({
      ...current,
      // Force-logout the affected user if they are no longer permitted to be active.
      currentUserId:
        current.currentUserId === userId && (status === 'SUSPENDED' || status === 'BANNED')
          ? null
          : current.currentUserId,
      users: current.users.map((user) =>
        user.id === userId
          ? { ...user, accountStatus: status, suspended: status === 'SUSPENDED' || status === 'BANNED' }
          : user,
      ),
    }));
    const messages: Record<AccountStatus, string> = {
      ACTIVE: 'Your account has been verified and is now active.',
      PENDING_VERIFICATION: 'Your account is pending verification.',
      SUSPENDED: 'Your account has been suspended.',
      BANNED: 'Your account has been banned for policy violations.',
    };
    this.notify(userId, 'account_status', messages[status]);
  }

  /** Printer availability toggle (spec "Availability System (Critical)"). */
  setPrinterAvailability(printerUserId: number, availability: PrinterAvailability): void {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return;
    this.syncApi(() => this.api.setPrinterAvailability(availability));
    this.state.update((current) => ({
      ...current,
      printers: current.printers.map((entry) =>
        entry.id === printer.id ? { ...entry, availability } : entry,
      ),
    }));
  }

  setCustomizationDraft(draft: CustomizationDraft): void {
    this.patchState({ customizationDraft: draft });
  }

  clearCustomizationDraft(): void {
    this.patchState({ customizationDraft: null });
  }

  removeCartItem(userId: number, cartItemId: number): void {
    this.state.update((current) => ({
      ...current,
      cartItems: current.cartItems.filter((item) => !(item.userId === userId && item.id === cartItemId)),
    }));
  }

  /**
   * Spec "Order Flow (Revised)" step 1-2: the customer submits an ORDER REQUEST.
   * No payment is taken yet — the order is created in REQUESTED state and the
   * printer must accept it before the customer can pay.
   */
  async submitOrderRequest(userId: number, payload: PlaceOrderPayload): Promise<Order | null> {
    const cart = this.cartForUser(userId);
    if (!cart.items.length) return null;

    const localOrderId = this.newOrderId();
    const response = await this.tryApi(() =>
      this.api.submitOrderRequest({ paymentMethod: payload.paymentMethod, shippingAddress: payload.shippingAddress }),
    );
    const order = this.finalizeLocalOrder(userId, payload, response?.orderId ?? localOrderId);

    // Notify the printer(s) of the incoming request and confirm to the customer.
    const printerUserIds = new Set<number>();
    order.lines.forEach((line) => {
      const printer = line.printerId ? this.getPrinterById(line.printerId) : null;
      if (printer) printerUserIds.add(printer.userId);
    });
    printerUserIds.forEach((pid) =>
      this.notify(pid, 'order_requested', `New order request ${order.id} is awaiting your decision.`, '/printer-dashboard'),
    );
    this.notify(userId, 'order_requested', `Request ${order.id} sent. Waiting for printer acceptance.`, `/tracking/${order.id}`);
    return order;
  }

  /**
   * New flow: the customer/user picks design + product + printer and sends the
   * request directly from printer selection (no cart). One order, one line,
   * REQUESTED. Payment only happens later, from the cart, after acceptance.
   */
  submitDraftOrderRequest(userId: number, shippingAddress?: string): Order | null {
    const draft = this.state().customizationDraft;
    if (!draft || !draft.selectedPrinterId || !draft.items.length) return null;
    const design = this.getDesignById(draft.designId);
    const printer = this.getPrinterById(draft.selectedPrinterId);
    if (!design || !printer) return null;

    const user = this.getUserById(userId);
    const margin = this.state().platformSettings.margin;
    const royalty = design.isUserUpload ? 0 : this.state().platformSettings.designerRoyalty;
    const orderId = this.newOrderId();

    // One line per chosen product (the buyer can order the design on several products).
    const lines: OrderLine[] = draft.items
      .map((item): OrderLine | null => {
        const product = this.getProductById(item.productId);
        if (!product) return null;
        const qty = Math.max(1, item.quantity || 1);
        const printerBase = this.offeringPrice(printer.id, product.id);
        return {
          id: this.takeNextId(),
          designId: design.id,
          designTitle: design.title,
          designImage: design.image,
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] ?? '/placeholder-image.svg',
          printerId: printer.id,
          printerName: printer.businessName,
          color: item.color,
          size: item.size,
          quantity: qty,
          x: item.placement.x,
          y: item.placement.y,
          scale: item.placement.scale,
          price: (printerBase + margin) * qty,
          printerAmount: printerBase * qty,
          platformFee: margin * qty,
          designerRoyalty: royalty * qty,
          status: 'Pending',
        };
      })
      .filter((l): l is OrderLine => l !== null);

    if (!lines.length) return null;

    const order: Order = {
      id: orderId,
      userId,
      createdAt: today(),
      trackingCode: String(orderId),
      total: lines.reduce((s, l) => s + l.price, 0),
      paymentMethod: 'd17',
      paymentStatus: 'unpaid',
      requestStatus: 'REQUESTED',
      shippingAddress:
        shippingAddress ||
        user?.customerProfile?.savedAddresses.find((a) => a.isDefault)?.line1 ||
        user?.address ||
        '',
      lines,
    };

    this.syncApi(() => this.api.submitOrderRequest({ paymentMethod: 'd17', shippingAddress: order.shippingAddress }));

    this.state.update((current) => ({
      ...current,
      orders: [order, ...current.orders],
      customizationDraft: null,
    }));

    this.notify(printer.userId, 'order_requested', `New order request ${order.id} is awaiting your decision.`, '/printer-dashboard');
    this.notify(userId, 'order_requested', `Request ${order.id} sent to ${printer.businessName}. Waiting for acceptance.`, `/tracking/${order.id}`);
    return order;
  }

  /** Orders the customer can pay now (printer accepted, not yet paid). */
  awaitingPaymentOrdersForUser(userId: number): Order[] {
    return this.state()
      .orders.filter((o) => o.userId === userId && o.requestStatus === 'ACCEPTED' && o.paymentStatus !== 'paid')
      .sort(sortByDateDesc);
  }

  /** Spec step 3: printer accepts the request → order becomes binding, customer may pay. */
  acceptOrderRequest(orderId: number | string): { success: boolean; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Order not found.' };
    if (order.requestStatus !== 'REQUESTED') {
      return { success: false, error: 'This request has already been processed.' };
    }
    this.syncApi(() => this.api.acceptOrderRequest(orderId));
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((entry) =>
        entry.id === order.id ? { ...entry, requestStatus: 'ACCEPTED' } : entry,
      ),
    }));
    this.notify(order.userId, 'order_accepted', `Your request ${order.id} was accepted. Go to your cart to pay.`, '/cart');
    return { success: true };
  }

  /** Spec step 3: printer rejects the request → order is cancelled, no payment. */
  rejectOrderRequest(orderId: number | string, reason?: string): { success: boolean; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Order not found.' };
    if (order.requestStatus !== 'REQUESTED') {
      return { success: false, error: 'This request has already been processed.' };
    }
    this.syncApi(() => this.api.rejectOrderRequest(orderId, reason));
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((entry) =>
        entry.id === order.id
          ? {
              ...entry,
              requestStatus: 'REJECTED',
              rejectionReason: reason?.trim() || 'The printer is unable to fulfill this request.',
              lines: entry.lines.map((line) => ({ ...line, status: 'Rejected' as OrderLineStatus })),
            }
          : entry,
      ),
    }));
    this.notify(order.userId, 'order_rejected', `Your request ${order.id} was rejected. ${reason?.trim() || ''}`.trim(), `/tracking/${order.id}`);
    return { success: true };
  }

  /**
   * Customer cancels the request. Allowed while it is still REQUESTED, or after
   * the printer ACCEPTED it but before payment (the buyer can still remove it
   * from the cart). The printer is notified that the customer canceled.
   */
  cancelOrderRequest(orderId: number | string, userId: number): { success: boolean; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order || order.userId !== userId) return { success: false, error: 'Order not found.' };
    if (order.paymentStatus === 'paid') {
      return { success: false, error: 'A paid order can no longer be cancelled here.' };
    }
    if (order.requestStatus !== 'REQUESTED' && order.requestStatus !== 'ACCEPTED') {
      return { success: false, error: 'This request can no longer be cancelled.' };
    }
    this.syncApi(() => this.api.cancelOrderRequest(orderId));
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((entry) =>
        entry.id === order.id
          ? {
              ...entry,
              requestStatus: 'CANCELLED',
              rejectionReason: 'Cancelled by the customer.',
              lines: entry.lines.map((line) => ({ ...line, status: 'Rejected' as OrderLineStatus })),
            }
          : entry,
      ),
    }));
    // Tell the printer(s) it was canceled by the customer.
    const printerUserIds = new Set<number>();
    order.lines.forEach((line) => {
      const p = line.printerId ? this.getPrinterById(line.printerId) : null;
      if (p) printerUserIds.add(p.userId);
    });
    printerUserIds.forEach((pid) =>
      this.notify(pid, 'order_rejected', `Order ${order.id} was canceled by the customer.`, '/printer-dashboard'),
    );
    return { success: true };
  }

  /**
   * Spec step 4-5: the customer pays an ACCEPTED order. Payment is only possible
   * after printer acceptance; on success the order is Confirmed and fulfillment begins.
   */
  async payForOrder(orderId: number | string): Promise<{ success: boolean; error?: string }> {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Order not found.' };
    if (order.requestStatus !== 'ACCEPTED') {
      return { success: false, error: 'You can only pay once the printer has accepted your request.' };
    }
    if (order.paymentStatus === 'paid') return { success: true };

    // Spec step 4-5 endpoint (the old POST /payment/:id predates this flow).
    await this.tryApi(() => this.api.payOrder(orderId, order.paymentMethod));

    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((entry) =>
        entry.id === order.id
          ? {
              ...entry,
              paymentStatus: 'paid',
              lines: entry.lines.map((line) =>
                line.status === 'Pending' ? { ...line, status: 'Confirmed' as OrderLineStatus } : line,
              ),
            }
          : entry,
      ),
    }));
    const printerUserIds = new Set<number>();
    order.lines.forEach((line) => {
      const printer = line.printerId ? this.getPrinterById(line.printerId) : null;
      if (printer) printerUserIds.add(printer.userId);
    });
    printerUserIds.forEach((pid) =>
      this.notify(pid, 'order_paid', `Order ${order.id} is paid — start fulfillment.`, '/printer-dashboard'),
    );
    this.notify(order.userId, 'order_paid', `Payment received for order ${order.id}. It is now confirmed.`, `/tracking/${order.id}`);
    return { success: true };
  }

  setOrderShippingAddress(orderId: number | string, address: string): void {
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((o) => (o.id === orderId ? { ...o, shippingAddress: address } : o)),
    }));
  }

  setOrderPaymentMethod(orderId: number | string, method: PaymentMethod): void {
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((o) => (o.id === orderId ? { ...o, paymentMethod: method } : o)),
    }));
  }

  markOrderPaymentStatus(orderId: number | string, status: PaymentStatus): void {
    this.state.update((current) => ({
      ...current,
      orders: current.orders.map((order) => (order.id === orderId ? { ...order, paymentStatus: status } : order)),
    }));
  }

  /**
   * Spec "Feedback & History": after delivery the customer rates BOTH the design
   * and the printer. One review per (order, target).
   */
  async submitReview(
    orderId: number | string,
    customerId: number,
    review: ReviewPayload & { target: ReviewTarget; designId?: number; printerId?: number },
  ): Promise<{ success: boolean; error?: string }> {
    const order = this.getOrderById(orderId);
    if (!order || order.userId !== customerId) {
      return { success: false, error: 'Order not found.' };
    }
    if (this.getOrderStatus(order) !== 'Delivered') {
      return { success: false, error: 'You can only review an order after it is delivered.' };
    }
    if (
      this.state().reviews.some(
        (entry) => entry.orderId === orderId && entry.customerId === customerId && entry.target === review.target,
      )
    ) {
      return { success: false, error: `You already reviewed the ${review.target} for this order.` };
    }

    await this.tryApi(() => this.api.submitReview(orderId, review));

    const nextReview: Review = {
      id: this.takeNextId(),
      orderId,
      customerId,
      rating: review.rating,
      comment: review.comment.trim(),
      createdAt: today(),
      target: review.target,
      designId: review.designId,
      printerId: review.printerId,
    };

    this.state.update((current) => ({
      ...current,
      reviews: [nextReview, ...current.reviews],
      // Reflect the rating on the rated design / printer aggregate.
      designs:
        review.target === 'design' && review.designId
          ? current.designs.map((d) =>
              d.id === review.designId ? { ...d, rating: Math.round(((d.rating + review.rating) / 2) * 10) / 10 } : d,
            )
          : current.designs,
      printers:
        review.target === 'printer' && review.printerId
          ? current.printers.map((p) =>
              p.id === review.printerId
                ? { ...p, rating: Math.round(((p.rating + review.rating) / 2) * 10) / 10, reviews: p.reviews + 1 }
                : p,
            )
          : current.printers,
    }));

    return { success: true };
  }

  addOrUpdateDesign(input: Partial<Design> & Pick<Design, 'title' | 'image' | 'category' | 'description'>, designerId: number): Design {
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
      category: input.categories?.[0] ?? input.category,
      categories: input.categories ?? existing?.categories ?? (input.category ? [input.category] : []),
      description: input.description,
      tags: (input.tags ?? existing?.tags ?? []).slice(0, 10),
      rating: existing?.rating ?? 0,
      sales: existing?.sales ?? 0,
      views: existing?.views ?? 0,
      engagementRate: existing?.engagementRate ?? 0,
      conversionRate: existing?.conversionRate ?? 0,
      // Legacy field retained but no longer designer-controlled pricing input.
      price: input.price ?? existing?.price ?? 0,
      status: input.status ?? existing?.status ?? 'ACTIVE',
      // New designer uploads await admin moderation before reaching the marketplace.
      moderation: existing?.moderation ?? 'PENDING',
      nsfw: input.nsfw ?? existing?.nsfw ?? false,
      // Designer marketplace designs are always preserved as intended; only the
      // customer's own uploads are customizable. Designer has no say here.
      customizationAllowed: false,
      isUserUpload: existing?.isUserUpload ?? false,
      uploadedByUserId: existing?.uploadedByUserId,
      assignedProductIds: input.assignedProductIds ?? existing?.assignedProductIds ?? [],
      productConfigurations: input.productConfigurations ?? existing?.productConfigurations ?? [],
      createdAt: existing?.createdAt ?? today(),
      updatedAt: today(),
    };

    this.state.update((current) => ({
      ...current,
      designs: existing
        ? current.designs.map((design) => (design.id === nextDesign.id ? nextDesign : design))
        : [nextDesign, ...current.designs],
    }));

    return nextDesign;
  }

  /**
   * Spec: a customer may upload their own artwork for personal printing. Such a
   * design is fully customizable, is owned by the customer, and never appears in
   * the public marketplace.
   */
  createUploadedDesign(userId: number, input: { title: string; image: string }): Design {
    const owner = this.getUserById(userId);
    const allProductIds = this.state().products.map((product) => product.id);
    const nextDesign: Design = {
      id: this.takeNextId(),
      title: input.title || 'My uploaded design',
      image: input.image,
      designerId: userId,
      designer: owner?.name ?? 'You',
      designerRank: 'Novice',
      designerAvatar: owner?.avatar ?? '/placeholder-image.svg',
      category: 'Custom',
      description: 'Customer-uploaded artwork for personal printing.',
      tags: [],
      rating: 0,
      sales: 0,
      views: 0,
      engagementRate: 0,
      conversionRate: 0,
      price: 0,
      status: 'ACTIVE',
      moderation: 'APPROVED',
      nsfw: false,
      customizationAllowed: true,
      isUserUpload: true,
      uploadedByUserId: userId,
      assignedProductIds: allProductIds,
      productConfigurations: [],
      createdAt: today(),
      updatedAt: today(),
    };
    this.state.update((current) => ({ ...current, designs: [nextDesign, ...current.designs] }));
    return nextDesign;
  }

  /** Admin updates platform-wide pricing policy (margin / fixed designer royalty). */
  updatePlatformSettings(updates: Partial<PlatformSettings>): void {
    this.state.update((current) => ({
      ...current,
      platformSettings: { ...current.platformSettings, ...updates },
    }));
  }

  setDesignStatus(designId: number, status: Design['status']): void {
    this.state.update((current) => ({
      ...current,
      designs: current.designs.map((design) => (design.id === designId ? { ...design, status, updatedAt: today() } : design)),
    }));
  }

  /** Admin reviews an uploaded design (spec: approve/reject/remove). */
  moderateDesign(adminId: number, designId: number, decision: 'APPROVED' | 'REJECTED', reason?: string): void {
    const design = this.getDesignById(designId);
    if (!design) return;
    // IDs are taken BEFORE the updater — takeNextId() writes to the same signal,
    // and a nested write would be discarded by the outer updater's return value.
    const logId = `mod-${this.takeNextId()}`;
    this.syncApi(() => this.api.moderateDesign(designId, decision, reason));
    this.state.update((current) => ({
      ...current,
      designs: current.designs.map((d) =>
        d.id === designId
          ? { ...d, moderation: decision, status: decision === 'REJECTED' ? 'REMOVED' : d.status, updatedAt: today() }
          : d,
      ),
      moderationLog: [
        {
          id: logId,
          adminId,
          targetType: 'design',
          targetId: designId,
          action: decision,
          reason,
          createdAt: new Date().toISOString(),
        },
        ...current.moderationLog,
      ],
    }));
    this.notify(
      design.designerId,
      'design_moderated',
      `Your design "${design.title}" was ${decision === 'APPROVED' ? 'approved and is now live' : 'rejected'}.`,
      '/designer-dashboard',
    );
  }

  /** Admin features/unfeatures a design, designer, or printer on the marketplace. */
  toggleFeatured(adminId: number, targetType: FeaturedContent['targetType'], targetId: number): void {
    // Both IDs are reserved up front: takeNextId() writes to the state signal,
    // so calling it inside the updater below would lose the increment.
    const featureId = `feat-${this.takeNextId()}`;
    const logId = `mod-${this.takeNextId()}`;
    this.syncApi(() => this.api.toggleFeatured(targetType, targetId));
    this.state.update((current) => {
      const existing = current.featured.find((f) => f.targetType === targetType && f.targetId === targetId);
      return {
        ...current,
        featured: existing
          ? current.featured.filter((f) => f !== existing)
          : [{ id: featureId, targetType, targetId, createdAt: new Date().toISOString() }, ...current.featured],
        moderationLog: [
          {
            id: logId,
            adminId,
            targetType,
            targetId,
            action: existing ? 'UNFEATURE' : 'FEATURE',
            createdAt: new Date().toISOString(),
          },
          ...current.moderationLog,
        ],
      };
    });
  }

  isFeatured(targetType: FeaturedContent['targetType'], targetId: number): boolean {
    return this.state().featured.some((f) => f.targetType === targetType && f.targetId === targetId);
  }

  /** Spec "Earnings & Performance": designer requests a payout once threshold is met. */
  requestDesignerPayout(userId: number): { success: boolean; error?: string } {
    const user = this.getUserById(userId);
    if (!user || user.role !== 'designer') return { success: false, error: 'Designer account required.' };
    const profile = { ...createDefaultDesignerProfile(user), ...user.designerProfile };
    const threshold = this.state().platformSettings.payoutThreshold;
    const balance = profile.payoutBalance ?? 0;
    if (balance < threshold) {
      return { success: false, error: `You need at least ${threshold} TND to request a payout.` };
    }
    const amount = balance;
    // Reserved before the updater — takeNextId() mutates the same signal.
    const payoutId = `pay-${this.takeNextId()}`;
    this.syncApi(() => this.api.requestDesignerPayout());
    this.state.update((current) => ({
      ...current,
      users: current.users.map((u) =>
        u.id === userId ? { ...u, designerProfile: { ...profile, payoutBalance: 0 } } : u,
      ),
      payouts: [
        {
          id: payoutId,
          designerId: userId,
          amount,
          status: 'requested',
          dueDate: new Date(Date.now() + PAYOUT_TERM_DAYS * MS_PER_DAY).toISOString().slice(0, 10),
          reference: `PO-${Date.now().toString().slice(-6)}`,
        },
        ...current.payouts,
      ],
    }));
    this.notify(userId, 'payout', `Payout request of ${amount} TND submitted.`, '/designer-dashboard');
    return { success: true };
  }

  /**
   * Set which products a design can be printed on. Only the design side is
   * stored; the reverse view comes from availableDesignsForProduct().
   */
  assignProductsToDesign(designId: number, productIds: number[]): void {
    this.state.update((current) => ({
      ...current,
      designs: current.designs.map((design) => (design.id === designId ? { ...design, assignedProductIds: productIds } : design)),
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

  /**
   * ADMIN-ONLY: create/edit a GLOBAL product type. The platform owns the catalog
   * (name, category, placeholder images, sizes/colors). Printers never call this.
   */
  addOrUpdateGlobalProduct(
    input: Partial<Product> & Pick<Product, 'name' | 'category' | 'description' | 'basePrice' | 'colors' | 'sizes' | 'images'>,
  ): Product {
    const existing = input.id ? this.getProductById(input.id) : null;
    const nextProduct: Product = {
      id: input.id ?? this.takeNextId(),
      printerId: 0,
      printerName: 'Printymand',
      name: input.name,
      category: input.category,
      description: input.description,
      basePrice: input.basePrice,
      colors: input.colors,
      sizes: input.sizes,
      images: input.images,
      availability: input.availability ?? existing?.availability ?? 'ACTIVE',
      leadTimeDays: input.leadTimeDays ?? existing?.leadTimeDays ?? 3,
      rating: existing?.rating ?? 0,
      totalOrders: existing?.totalOrders ?? 0,
    };
    this.state.update((current) => ({
      ...current,
      products: existing
        ? current.products.map((product) => (product.id === nextProduct.id ? nextProduct : product))
        : [...current.products, nextProduct],
    }));
    return nextProduct;
  }

  /** ADMIN-ONLY: remove a global product type and any printer offerings for it. */
  removeGlobalProduct(productId: number): void {
    this.state.update((current) => ({
      ...current,
      products: current.products.filter((p) => p.id !== productId),
      offerings: current.offerings.filter((o) => o.productId !== productId),
      designs: current.designs.map((d) => ({
        ...d,
        assignedProductIds: d.assignedProductIds.filter((id) => id !== productId),
      })),
    }));
  }

  // ── Printer offerings (opt-in + pricing for global products) ──

  offeringsForPrinterUser(printerUserId: number): PrinterProductOffering[] {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return [];
    return this.state().offerings.filter((o) => o.printerId === printer.id);
  }

  getOffering(printerId: number, productId: number): PrinterProductOffering | undefined {
    return this.state().offerings.find((o) => o.printerId === printerId && o.productId === productId);
  }

  /** Printer's production price for a global product (falls back to reference price). */
  offeringPrice(printerId: number, productId: number): number {
    const offering = this.getOffering(printerId, productId);
    if (offering) return offering.basePrice;
    return this.getProductById(productId)?.basePrice ?? 0;
  }

  /** Printers that currently offer a given global product (available offering). */
  printersForProduct(productId: number): PrinterPartner[] {
    const printerIds = new Set(
      this.state().offerings.filter((o) => o.productId === productId && o.available).map((o) => o.printerId),
    );
    return this.state().printers.filter((p) => printerIds.has(p.id) && !p.retired);
  }

  /** Printer opts into / prices / toggles a global product. Cannot create products. */
  /**
   * Printer opts into / prices a global product. The price is clamped to be at
   * least the admin-set floor (product.basePrice). Returns whether it was clamped.
   */
  setPrinterOffering(
    printerUserId: number,
    productId: number,
    basePrice: number,
    available: boolean,
    description?: string,
  ): { success: boolean; clamped: boolean; floor: number } {
    const printer = this.getPrinterByUserId(printerUserId);
    const product = this.getProductById(productId);
    if (!printer || !product) return { success: false, clamped: false, floor: 0 };
    const floor = product.basePrice;
    const clamped = basePrice < floor;
    const finalPrice = clamped ? floor : basePrice;
    // Reserved before the updater — takeNextId() mutates the same signal.
    const offeringId = this.takeNextId();
    this.syncApi(() =>
      this.api.savePrinterProduct({ productId, basePrice: finalPrice, available, description }),
    );
    this.state.update((current) => {
      const existing = current.offerings.find((o) => o.printerId === printer.id && o.productId === productId);
      if (existing) {
        return {
          ...current,
          offerings: current.offerings.map((o) =>
            o === existing ? { ...o, basePrice: finalPrice, available, description: description ?? o.description } : o,
          ),
        };
      }
      return {
        ...current,
        offerings: [
          {
            id: offeringId,
            printerId: printer.id,
            productId,
            basePrice: finalPrice,
            description,
            available,
            createdAt: today(),
          },
          ...current.offerings,
        ],
      };
    });
    return { success: true, clamped, floor };
  }

  /** Printer stops offering a global product entirely. */
  removePrinterOffering(printerUserId: number, productId: number): void {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return;
    this.state.update((current) => ({
      ...current,
      offerings: current.offerings.filter(
        (o) => !(o.printerId === printer.id && o.productId === productId),
      ),
    }));
  }

  printerPayoutsForUser(printerUserId: number): PrinterPayoutRecord[] {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return [];
    return this.state().printerPayouts.filter((p) => p.printerId === printer.id);
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
    const order = this.getOrderById(orderId);
    if (order) {
      this.notify(order.userId, 'order_status', `Order ${order.id}: an item is now "${status}".`, `/tracking/${order.id}`);
      this.settleOrderIfDelivered(orderId);
    }
  }

  advanceOrderLineStatus(orderId: number | string, lineId: number): void {
    // Post-payment fulfillment progression only (spec: Confirmed → Printing → Shipped → Delivered).
    const steps: OrderLineStatus[] = ['Confirmed', 'Printing', 'Shipped', 'Delivered'];
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
    const order = this.getOrderById(orderId);
    if (order) {
      const line = order.lines.find((l) => l.id === lineId);
      if (line) this.notify(order.userId, 'order_status', `Order ${order.id}: "${line.designTitle}" is now ${line.status}.`, `/tracking/${order.id}`);
      this.settleOrderIfDelivered(orderId);
    }
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

  /** Global products this printer has opted into (has an offering for). */
  productsForPrinterUser(printerUserId: number): Product[] {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return [];
    const offered = new Set(
      this.state().offerings.filter((o) => o.printerId === printer.id).map((o) => o.productId),
    );
    return this.state().products.filter((p) => offered.has(p.id));
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

  /** Orders awaiting this printer's accept/reject decision (spec step 3). */
  ordersAwaitingPrinter(printerUserId: number): Order[] {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return [];
    return this.state()
      .orders.filter(
        (order) => order.requestStatus === 'REQUESTED' && order.lines.some((line) => line.printerId === printer.id),
      )
      .sort(sortByDateDesc);
  }

  /** Requests this printer accepted but the customer then canceled (pre-payment). */
  canceledOrdersForPrinter(printerUserId: number): Order[] {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return [];
    return this.state()
      .orders.filter(
        (order) => order.requestStatus === 'CANCELLED' && order.lines.some((line) => line.printerId === printer.id),
      )
      .sort(sortByDateDesc);
  }

  /** Accepted + paid orders this printer must fulfill (post-payment progression). */
  fulfillmentLinesForPrinter(printerUserId: number): Array<OrderLine & { orderId: number | string; customer: User | undefined }> {
    const printer = this.getPrinterByUserId(printerUserId);
    if (!printer) return [];
    return this.state()
      .orders.filter((order) => order.requestStatus === 'ACCEPTED' && order.paymentStatus === 'paid')
      .flatMap((order) =>
        order.lines
          .filter((line) => line.printerId === printer.id)
          .map((line) => ({ ...line, orderId: order.id, customer: this.getUserById(order.userId) })),
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
        // Spec pricing: customer pays printer base price + fixed platform margin.
        // The designer does NOT influence price.
        const lineTotal = product.basePrice + this.state().platformSettings.margin;
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

  /**
   * Customer-facing order stage reflecting the approval-gated lifecycle:
   * Requested → Awaiting payment (accepted) → Confirmed → Printing → Shipped → Delivered,
   * plus the Rejected / Cancelled terminal states.
   */
  getOrderStatus(order: Order): string {
    if (order.requestStatus === 'REJECTED') return 'Rejected';
    if (order.requestStatus === 'CANCELLED') return 'Cancelled';
    if (order.requestStatus === 'REQUESTED') return 'Requested';
    if (order.paymentStatus !== 'paid') return 'Awaiting payment';
    const statuses = order.lines.map((line) => line.status);
    if (statuses.length && statuses.every((status) => status === 'Delivered')) return 'Delivered';
    if (statuses.some((status) => status === 'Shipped')) return 'Shipped';
    if (statuses.some((status) => status === 'Printing')) return 'Printing';
    return 'Confirmed';
  }

  buildOrderTimeline(order: Order): Array<{ label: string; done: boolean }> {
    const orderSteps = ['Requested', 'Accepted', 'Paid', 'Printing', 'Shipped', 'Delivered'];
    if (order.requestStatus === 'REJECTED' || order.requestStatus === 'CANCELLED') {
      // Only the initial "Requested" step is considered done for a terminated request.
      return orderSteps.map((label, index) => ({ label, done: index === 0 }));
    }
    const stage = this.getOrderStatus(order);
    const stageToIndex: Record<string, number> = {
      Requested: 0,
      'Awaiting payment': 1,
      Confirmed: 2,
      Printing: 3,
      Shipped: 4,
      Delivered: 5,
    };
    const activeIndex = stageToIndex[stage] ?? 0;
    return orderSteps.map((label, index) => ({ label, done: index <= activeIndex }));
  }

  designerAnalytics(designerId: number): DesignAnalytics[] {
    const lines = this.linesForDesigner(designerId);
    return this.designsForDesigner(designerId).map((design) => {
      const designLines = lines.filter((line) => line.designId === design.id && line.status !== 'Rejected');
      // Spec: designer earns a platform-fixed royalty per sale (not a cut of price).
      const revenue = designLines.length * this.state().platformSettings.designerRoyalty;
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

  /**
   * Non-sensitive headline figures safe to render on public pages.
   * Deliberately excludes revenue and the total user count — see adminOverview().
   */
  publicStats(): { designers: number; designs: number; pressrooms: number; deliveredOrders: number } {
    const state = this.state();
    return {
      designers: state.users.filter((user) => user.role === 'designer').length,
      designs: this.marketplaceDesigns().filter((design) => design.status === 'ACTIVE').length,
      pressrooms: state.printers.filter((printer) => !printer.retired).length,
      deliveredOrders: state.orders.filter((order) => this.getOrderStatus(order) === 'Delivered').length,
    };
  }

  /** ADMIN-ONLY aggregate — never render this on a public page. */
  adminOverview(): { users: number; orders: number; revenue: number; activeDesigns: number; activePrinters: number } {
    return {
      users: this.state().users.length,
      orders: this.state().orders.length,
      revenue: this.state().orders.reduce((sum, order) => sum + order.total, 0),
      activeDesigns: this.state().designs.filter((design) => design.status === 'ACTIVE').length,
      activePrinters: this.state().printers.length,
    };
  }

  /**
   * Cheapest total a buyer could pay for this design: the lowest floor price
   * among the products it is assigned to, plus the platform margin. Returns
   * null when the design has no printable product.
   *
   * This is the only correct "price" for a design — `Design.price` is a legacy
   * design fee that no longer forms part of what the customer pays.
   */
  designFromPrice(design: Design): number | null {
    const products = this.availableProductsForDesign(design.id).filter((p) => p.availability !== 'DRAFT');
    if (!products.length) return null;
    return Math.min(...products.map((p) => p.basePrice)) + this.state().platformSettings.margin;
  }

  availableProductsForDesign(designId: number): Product[] {
    const design = this.getDesignById(designId);
    if (!design) return [];
    return this.state().products.filter((product) => design.assignedProductIds.includes(product.id));
  }

  availableDesignsForProduct(productId: number): Design[] {
    return this.state().designs.filter(
      (design) =>
        design.assignedProductIds.includes(Number(productId)) &&
        design.status === 'ACTIVE' &&
        (design.moderation ?? 'APPROVED') === 'APPROVED' &&
        !design.isUserUpload,
    );
  }

  /** Marketplace listing: only admin-approved designs, excluding personal uploads. */
  marketplaceDesigns(): Design[] {
    return this.state().designs.filter(
      (design) => !design.isUserUpload && (design.moderation ?? 'APPROVED') === 'APPROVED',
    );
  }

  /** Public storefront listing for one designer: approved, active, non-upload. */
  storefrontDesigns(designerId: number): Design[] {
    return this.designsForDesigner(designerId).filter(
      (design) =>
        design.status === 'ACTIVE' && (design.moderation ?? 'APPROVED') === 'APPROVED' && !design.isUserUpload,
    );
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
        const line: OrderLine = {
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
          price: (printer ? this.offeringPrice(printer.id, product.id) : product.basePrice) + this.state().platformSettings.margin,
          // Money split (spec §2): printer production + platform fee + designer royalty
          // (royalty funded from the platform margin; 0 for customer-uploaded designs).
          printerAmount: printer ? this.offeringPrice(printer.id, product.id) : product.basePrice,
          platformFee: this.state().platformSettings.margin,
          designerRoyalty: design.isUserUpload ? 0 : this.state().platformSettings.designerRoyalty,
          status: 'Pending',
        };
        return line;
      })
      .filter((line): line is OrderLine => line !== null);

    const createdOrder: Order = {
      id: orderId,
      userId,
      createdAt: today(),
      trackingCode: String(orderId),
      total: lines.reduce((sum, line) => sum + line.price, 0),
      paymentMethod: payload.paymentMethod,
      // Approval-gated: no payment until the printer accepts the request.
      paymentStatus: 'unpaid',
      requestStatus: 'REQUESTED',
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

  /** Create an in-app notification for a user (spec: notify on each status change). */
  private notify(userId: number, type: NotificationType, message: string, link?: string): void {
    const notification: AppNotification = {
      id: this.takeNextId(),
      userId,
      type,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.state.update((current) => ({ ...current, notifications: [notification, ...current.notifications] }));
  }

  markNotificationRead(notificationId: number): void {
    this.state.update((current) => ({
      ...current,
      notifications: current.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    }));
  }

  markAllNotificationsRead(userId: number): void {
    this.state.update((current) => ({
      ...current,
      notifications: current.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
    }));
  }

  /**
   * Settle an order once all its lines are Delivered: credit designer royalties,
   * release printer payouts, bump performance scores and recompute levels.
   */
  private settleOrderIfDelivered(orderId: number | string): void {
    const order = this.getOrderById(orderId);
    if (!order || order.requestStatus !== 'ACCEPTED' || order.paymentStatus !== 'paid') return;
    if (!order.lines.length || !order.lines.every((line) => line.status === 'Delivered')) return;
    if (this.state().printerPayouts.some((p) => String(p.orderId) === String(orderId))) return; // already settled

    const now = new Date().toISOString();
    const printerPayouts: PrinterPayoutRecord[] = [];
    const designerCredits = new Map<number, number>();
    let printerScoreUserId: number | null = null;

    for (const line of order.lines) {
      const royalty = line.designerRoyalty ?? 0;
      const design = this.getDesignById(line.designId);
      if (design && !design.isUserUpload && royalty > 0) {
        designerCredits.set(design.designerId, (designerCredits.get(design.designerId) ?? 0) + royalty);
      }
      const printer = line.printerId ? this.getPrinterById(line.printerId) : null;
      if (printer) {
        printerScoreUserId = printer.userId;
        printerPayouts.push({
          id: `pp-${this.takeNextId()}`,
          printerId: printer.id,
          orderId: order.id,
          amount: line.printerAmount ?? 0,
          status: 'paid',
          releasedAt: now,
        });
      }
    }

    // Derive the printer's new score/rank ONCE, before the updater, so the users
    // map and the printers map below cannot disagree (they previously recomputed
    // it independently, one of them reading pre-update state).
    const scoredPrinterUser = printerScoreUserId !== null ? this.getUserById(printerScoreUserId) : undefined;
    const nextFulfillmentScore = (scoredPrinterUser?.printerProfile?.fulfillmentScore ?? 0) + FULFILLMENT_SCORE_PER_ORDER;
    const nextPrinterRank = printerLevelForScore(nextFulfillmentScore);
    const printerRevenueDelta = order.lines.reduce((sum, line) => sum + (line.printerAmount ?? 0), 0);

    this.state.update((current) => ({
      ...current,
      printerPayouts: [...printerPayouts, ...current.printerPayouts],
      users: current.users.map((user) => {
        // Designer: accrue royalty balance + sales score, recompute level.
        if (designerCredits.has(user.id)) {
          const profile = { ...createDefaultDesignerProfile(user), ...user.designerProfile };
          const salesScore = (profile.salesScore ?? 0) + designerCredits.size + 1;
          return {
            ...user,
            designerRank: designerLevelForScore(salesScore),
            designerProfile: {
              ...profile,
              payoutBalance: (profile.payoutBalance ?? 0) + (designerCredits.get(user.id) ?? 0),
              salesScore,
            },
          };
        }
        // Printer: bump fulfillment score, recompute level.
        if (printerScoreUserId === user.id) {
          const profile = { ...createDefaultPrinterProfile(user), ...user.printerProfile };
          return {
            ...user,
            printerRank: nextPrinterRank,
            printerProfile: { ...profile, fulfillmentScore: nextFulfillmentScore },
          };
        }
        return user;
      }),
      printers: current.printers.map((p) =>
        p.userId === printerScoreUserId
          ? { ...p, revenue: p.revenue + printerRevenueDelta, rank: nextPrinterRank }
          : p,
      ),
    }));

    // Notify designers about accrued royalties.
    designerCredits.forEach((amount, designerId) => {
      this.notify(designerId, 'payout', `You earned ${amount} TND in royalties from order ${order.id}.`);
    });
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

  /** Test-only escape hatch for asserting on persistence/migration behaviour. */
  snapshotForTesting(): PlatformState {
    return this.state();
  }

  private patchState(partial: Partial<PlatformState>): void {
    this.state.update((current) => ({ ...current, ...partial }));
  }

  private takeNextId(): number {
    const nextId = this.state().nextId + 1;
    this.patchState({ nextId });
    return nextId;
  }

  /**
   * Human-readable order reference, matching the seed shape `PMD-YYMMDD-<seq>`.
   * The same value is used as the tracking code so an order has one canonical
   * reference rather than two formats that drift apart.
   */
  private newOrderId(): string {
    return `PMD-${dateStamp()}-${this.takeNextId()}`;
  }

  private seededState(): PlatformState {
    return {
      backendMode: environment.useRealApi ? 'hybrid' : 'mock',
      currentUserId: null,
      nextId: 10000,
      users: seedUsers.map((user) => ensureRoleDefaults(user)),
      credentials: demoAccounts.flatMap((account) => {
        const user = seedUsers.find((candidate) => candidate.email === account.email);
        return user ? [{ email: account.email, passwordHash: digestPassword(account.password), userId: user.id }] : [];
      }),
      printers: seedPrinters.map(normalizePrinter),
      products: seedProducts,
      offerings: seedOfferings,
      designs: seedDesigns.map(normalizeDesign),
      cartItems: [],
      orders: seedOrders.map(normalizeOrder),
      reviews: seedReviews.map(normalizeReview),
      payouts: seedPayouts,
      printerPayouts: [],
      notifications: [],
      featured: [],
      moderationLog: [],
      customizationDraft: null,
      platformSettings: { ...DEFAULT_PLATFORM_SETTINGS },
    };
  }

  private readState(): PlatformState {
    const seeded = this.seededState();

    let parsed: Partial<PlatformState> | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      parsed = raw ? (JSON.parse(raw) as Partial<PlatformState>) : null;
    } catch {
      parsed = null;
    }
    if (!parsed) return seeded;

    // Catalog entities added to the seed data after this browser last saved are
    // merged in by id, so new products/printers/designs appear without wiping
    // the user's own records. Persisted copies always win on conflict.
    const restored: PlatformState = {
      ...seeded,
      ...parsed,
      backendMode: seeded.backendMode,
      platformSettings: { ...DEFAULT_PLATFORM_SETTINGS, ...parsed.platformSettings },
      nextId: typeof parsed.nextId === 'number' ? parsed.nextId : seeded.nextId,
      credentials: Array.isArray(parsed.credentials) ? parsed.credentials : seeded.credentials,
      cartItems: parsed.cartItems ?? [],
      printerPayouts: parsed.printerPayouts ?? [],
      notifications: parsed.notifications ?? [],
      featured: parsed.featured ?? [],
      moderationLog: parsed.moderationLog ?? [],
      payouts: parsed.payouts ?? seeded.payouts,
      users: mergeById(seeded.users, parsed.users, (user) => ensureRoleDefaults(user)),
      printers: mergeById(seeded.printers, parsed.printers, normalizePrinter),
      products: mergeById(seeded.products, parsed.products),
      offerings: mergeById(seeded.offerings, parsed.offerings),
      designs: mergeById(seeded.designs, parsed.designs, normalizeDesign),
      orders: Array.isArray(parsed.orders) ? parsed.orders.map(normalizeOrder) : seeded.orders,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews.map(normalizeReview) : seeded.reviews,
    };

    // A stored nextId must never trail existing ids, or takeNextId() hands out
    // values that are already in use.
    restored.nextId = Math.max(restored.nextId, highestUsedId(restored) + 1);
    return restored;
  }

  private persistState(state: PlatformState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      this.persistError.set(null);
    } catch {
      // Most likely the 5 MB quota: uploaded artwork is inlined as data URLs.
      // Keep the session working in memory and surface the failure to the UI.
      this.persistError.set(
        'Local storage is full — recent changes are kept for this session only. Remove some uploaded designs to save again.',
      );
    }
  }
}

/**
 * Merge persisted records over seeded ones by id. Persisted entries win; seeded
 * entries the browser has never seen are appended.
 */
function mergeById<T extends { id: number }>(
  seeded: T[],
  persisted: T[] | undefined,
  normalize: (entry: T) => T = (entry) => entry,
): T[] {
  if (!Array.isArray(persisted)) return seeded.map(normalize);
  const merged = persisted.map(normalize);
  const known = new Set(merged.map((entry) => entry.id));
  for (const entry of seeded) {
    if (!known.has(entry.id)) merged.push(normalize(entry));
  }
  return merged;
}

/** Largest numeric id currently in use across all id-bearing collections. */
function highestUsedId(state: PlatformState): number {
  const ids: number[] = [
    ...state.users.map((entry) => entry.id),
    ...state.printers.map((entry) => entry.id),
    ...state.products.map((entry) => entry.id),
    ...state.offerings.map((entry) => entry.id),
    ...state.designs.map((entry) => entry.id),
    ...state.reviews.map((entry) => entry.id),
    ...state.notifications.map((entry) => entry.id),
    ...state.cartItems.map((entry) => entry.id),
    ...state.orders.flatMap((order) => order.lines.map((line) => line.id)),
  ];
  return ids.reduce((max, id) => (Number.isFinite(id) && id > max ? id : max), 0);
}

function createUserForRole(input: {
  id: number;
  name: string;
  email: string;
  address: string;
  role: UserRole;
  accountStatus?: AccountStatus;
}): User {
  return ensureRoleDefaults({
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    address: input.address,
    accountStatus: input.accountStatus ?? 'ACTIVE',
    joinDate: today(),
    avatar: seedUsers[0]?.avatar ?? '/placeholder-image.svg',
  });
}

function ensureRoleDefaults(user: User): User {
  const baseUser: User = {
    ...user,
    // Default existing/seed accounts to ACTIVE so demos keep working; only freshly
    // registered designers/printers are explicitly set to PENDING_VERIFICATION.
    accountStatus: user.accountStatus ?? (user.suspended ? 'SUSPENDED' : 'ACTIVE'),
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
    salesScore: 0,
    payoutBalance: 0,
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
    printingMethods: ['DTF'],
    coverageZones: [],
    fulfillmentScore: 0,
    processingDays: 3,
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
    availability: 'available',
    retired: false,
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

/** `YYMMDD` stamp used inside order references. */
function dateStamp(date = new Date()): string {
  return date.toISOString().slice(2, 10).replace(/-/g, '');
}

/** Today as `YYYY-MM-DD` — the date format stored on every record. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Backfill fields added to PrinterPartner after the seed data was written. */
function normalizePrinter(printer: PrinterPartner): PrinterPartner {
  return { ...printer, retired: printer.retired ?? false };
}

/** Backfill ER-aligned fields on legacy/seed designs. */
function normalizeDesign(design: Design): Design {
  return {
    ...design,
    moderation: design.moderation ?? 'APPROVED',
    nsfw: design.nsfw ?? false,
    customizationAllowed: design.customizationAllowed ?? false,
    isUserUpload: design.isUserUpload ?? false,
  };
}

/** Backfill the money split + request lifecycle on legacy/seed orders. */
function normalizeOrder(order: Order): Order {
  return {
    ...order,
    requestStatus: order.requestStatus ?? 'ACCEPTED',
    paymentStatus: order.paymentStatus ?? 'paid',
    lines: order.lines.map((line) => {
      if (line.printerAmount !== undefined && line.platformFee !== undefined && line.designerRoyalty !== undefined) {
        return line;
      }
      const platformFee = line.platformFee ?? Math.min(10, line.price);
      const designerRoyalty = line.designerRoyalty ?? Math.min(5, Math.max(0, line.price - platformFee));
      return {
        ...line,
        platformFee,
        designerRoyalty,
        printerAmount: line.printerAmount ?? Math.max(0, line.price - platformFee - designerRoyalty),
      };
    }),
  };
}

/** Backfill the review target (legacy reviews were design reviews). */
function normalizeReview(review: Review): Review {
  return { ...review, target: review.target ?? 'design' };
}
