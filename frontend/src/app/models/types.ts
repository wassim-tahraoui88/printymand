export type UserRole = 'customer' | 'designer' | 'printer' | 'admin';

export type DesignerRank = 'Novice' | 'Rising' | 'Artisan' | 'Elite';
export type PrinterRank = 'Verified' | 'Gold' | 'Premium';

export type DesignStatus = 'ACTIVE' | 'ARCHIVED' | 'REMOVED';
export type ProductAvailability = 'ACTIVE' | 'PAUSED' | 'DRAFT';
// Per spec: order is tracked Pending -> Confirmed -> Printing -> Shipped -> Delivered.
// "Confirmed" = printer accepted AND customer paid. "Rejected" = printer rejected the request.
export type OrderLineStatus = 'Pending' | 'Confirmed' | 'Printing' | 'Shipped' | 'Delivered' | 'Rejected';
// Approval-gated order lifecycle (spec "Order Flow (Revised)").
export type OrderRequestStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
// Spec payment providers: Paymee, D17, or card. "cash" retained for cash-on-delivery support.
export type PaymentMethod = 'paymee' | 'd17' | 'card' | 'cash';
export type PaymentStatus = 'unpaid' | 'pending' | 'processing' | 'paid';
// Account verification lifecycle (spec: admin verifies printers/designers at signup).
export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'BANNED';
// Printer availability toggle (spec "Availability System (Critical)").
export type PrinterAvailability = 'available' | 'busy' | 'holiday';
// Design moderation gate (admin reviews uploads before they reach the marketplace).
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
// Printing methods a printer offers (spec "Fulfillment Setup").
export type PrintingMethod = 'DTF' | 'sublimation' | 'screen-printing' | 'embroidery' | 'vinyl';
export type PayoutStatus = 'scheduled' | 'requested' | 'processing' | 'paid';
export type ReviewTarget = 'design' | 'printer';
export type NotificationType =
  | 'order_requested'
  | 'order_accepted'
  | 'order_rejected'
  | 'order_paid'
  | 'order_status'
  | 'design_moderated'
  | 'account_status'
  | 'payout';

export interface CursorPaginationParams {
  cursor?: number;
  limit?: number;
  filter?: Record<string, unknown>;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 1 | -1;
}

export interface OffsetPaginationParams {
  offset?: number;
  limit?: number;
  filter?: Record<string, unknown>;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 1 | -1;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: number;
  hasMore: boolean;
  total?: number;
}

export interface PaginatedOrders<T = ApiOrder> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface RegisterData {
  name: string;
  email: string;
  address: string;
  password: string;
  role: Extract<UserRole, 'customer' | 'designer' | 'printer'>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  address: string;
  password: string;
  role: Extract<UserRole, 'customer' | 'designer' | 'printer'>;
}

export interface Address {
  id: number;
  label: string;
  recipient: string;
  line1: string;
  city: string;
  governorate: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}

export interface PaymentPreference {
  id: string;
  label: string;
  provider: PaymentMethod;
  details: string;
  isDefault: boolean;
  enabled: boolean;
}

export interface CustomerProfile {
  phone: string;
  savedAddresses: Address[];
  paymentPreferences: PaymentPreference[];
  favoritePrinterIds: number[];
  notes: string;
}

export interface PortfolioLink {
  id: string;
  label: string;
  url: string;
}

export interface DesignerProfile {
  bio: string;
  banner: string;
  payoutAccount: string;
  profilePicture: string;
  portfolioLinks: PortfolioLink[];
  /** Spec "Designer Roles": level is derived from sales score. (Defaulted at load.) */
  salesScore?: number;
  /** Accrued, not-yet-paid-out designer royalties. (Defaulted at load.) */
  payoutBalance?: number;
}

export interface PrinterProfile {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  governorate: string;
  about: string;
  productionMethods: string[];
  /** Typed printing methods (spec "Fulfillment Setup"). (Defaulted at load.) */
  printingMethods?: PrintingMethod[];
  coverageZones: string[];
  /** Spec "Printer roles": level derived from fulfillment score. (Defaulted at load.) */
  fulfillmentScore?: number;
  /** Typical processing time before shipping. (Defaulted at load.) */
  processingDays?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  address: string;
  avatar?: string;
  designerRank?: DesignerRank;
  printerRank?: PrinterRank;
  suspended?: boolean;
  accountStatus?: AccountStatus;
  joinDate: string;
  customerProfile?: CustomerProfile;
  designerProfile?: DesignerProfile;
  printerProfile?: PrinterProfile;
}

export interface DesignProductConfiguration {
  productId: number;
  defaultPlacement: {
    x: number;
    y: number;
    scale: number;
  };
  availableColors: string[];
  /** Per-product copy set by the designer (e.g. a t-shirt blurb differs from a mug). */
  title?: string;
  description?: string;
}

export interface Design {
  id: number;
  title: string;
  image: string;
  designerId: number;
  designer: string;
  designerRank: DesignerRank;
  designerAvatar: string;
  category: string;
  description: string;
  tags: string[];
  rating: number;
  sales: number;
  views: number;
  engagementRate: number;
  conversionRate: number;
  /**
   * Legacy "design fee" — NO LONGER part of the customer price (spec: designer does
   * not influence pricing). Kept for backward compatibility / display of historical data.
   */
  price: number;
  status: DesignStatus;
  /** Admin moderation gate — only APPROVED designs appear in the marketplace. */
  moderation?: ModerationStatus;
  /** Content flag (spec: admin handles copyright / NSFW abuse). */
  nsfw?: boolean;
  /**
   * Spec "Customization Rule": a designer marketplace design is preserved as intended
   * and cannot be repositioned/scaled by the customer unless the designer opts in.
   */
  customizationAllowed?: boolean;
  /** True when a customer uploaded their own artwork for personal printing. */
  isUserUpload?: boolean;
  /** Owning customer id when isUserUpload is true. */
  uploadedByUserId?: number;
  assignedProductIds: number[];
  productConfigurations: DesignProductConfiguration[];
  createdAt: string;
  updatedAt: string;
}

/**
 * GLOBAL product type — the platform owns the catalog (name, category,
 * placeholder/mockup images, sizes/colors). There is exactly ONE "Phone Case",
 * one "Mug", etc. across the whole platform. Only admins create/edit these.
 * Printers do NOT own products; they opt in and price via PrinterProductOffering.
 */
export interface Product {
  id: number;
  /** Deprecated for the global catalog (kept 0 / "Printymand" for back-compat). */
  printerId: number;
  printerName: string;
  name: string;
  category: string;
  description: string;
  /** Platform reference / "from" price used for display before a printer is chosen. */
  basePrice: number;
  colors: string[];
  sizes: string[];
  /** Platform-owned placeholder / mockup images. */
  images: string[];
  availability: ProductAvailability;
  leadTimeDays: number;
  rating: number;
  totalOrders: number;
  assignedDesignIds: number[];
}

/**
 * A printer's opt-in for a GLOBAL product: their production price and whether
 * they currently fulfill it. Printers cannot create products or upload mockups —
 * they only choose supported products, set pricing and availability.
 */
export interface PrinterProductOffering {
  id: number;
  printerId: number;
  productId: number;
  basePrice: number;
  available: boolean;
  createdAt: string;
}

export interface PrinterPartner {
  id: number;
  userId: number;
  businessName: string;
  rank: PrinterRank;
  rating: number;
  reviews: number;
  fulfillmentRate: number;
  revenue: number;
  deliveryDays: number;
  location: string;
  images: string[];
  availability: PrinterAvailability;
}

export interface PlatformSettings {
  /** Fixed platform margin added on top of the printer base price (spec §2/§3). */
  margin: number;
  /** Platform-fixed designer royalty per sale; designer cannot modify it (spec §5). */
  designerRoyalty: number;
  /** Minimum balance before a designer can request a payout. */
  payoutThreshold: number;
  /** Marketplace categories controlled by the platform. */
  categories: string[];
}

export interface CustomizationDraft {
  designId: number;
  productId: number;
  selectedColor: string;
  selectedSize: string;
  selectedPrinterId: number | null;
  placement: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface CartItemPayload {
  design: {
    id: number;
    x: number;
    y: number;
    scale: number;
  };
  product: {
    id: number;
    color: string;
  };
}

export interface CartItem {
  id: number;
  userId: number;
  designId: number;
  productId: number;
  printerId: number | null;
  color: string;
  size: string;
  x: number;
  y: number;
  scale: number;
  createdAt: string;
}

export interface CartLineView {
  id: number;
  design: Design;
  product: Product;
  printer: PrinterPartner | null;
  color: string;
  size: string;
  placement: {
    x: number;
    y: number;
    scale: number;
  };
  lineTotal: number;
}

export interface Cart {
  items: CartLineView[];
  total: number;
}

export interface OrderLine {
  id: number;
  designId: number;
  designTitle: string;
  designImage: string;
  productId: number;
  productName: string;
  productImage: string;
  printerId: number | null;
  printerName: string;
  color: string;
  size: string;
  x: number;
  y: number;
  scale: number;
  price: number;
  /** Money split (spec §2): printer production + platform fee + designer royalty. (Defaulted at load.) */
  printerAmount?: number;
  platformFee?: number;
  designerRoyalty?: number;
  status: OrderLineStatus;
}

export interface Order {
  id: number | string;
  userId: number;
  createdAt: string;
  trackingCode: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Approval gate: printer must ACCEPT before the customer can pay (spec). */
  requestStatus: OrderRequestStatus;
  rejectionReason?: string;
  shippingAddress: string;
  lines: OrderLine[];
}

export interface Review {
  id: number;
  orderId: number | string;
  customerId: number;
  rating: number;
  comment: string;
  createdAt: string;
  /** Spec: after delivery the customer rates BOTH the design and the printer. (Defaulted at load.) */
  target?: ReviewTarget;
  designId?: number;
  printerId?: number;
}

export interface AppNotification {
  id: number;
  userId: number;
  type: NotificationType;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

/** Designer royalty payout (spec "Earnings & Performance"). */
export interface PrinterPayoutRecord {
  id: string;
  printerId: number;
  orderId: number | string;
  amount: number;
  status: PayoutStatus;
  releasedAt: string;
}

/** Admin-curated featured designs/designers/printers (spec admin powers). */
export interface FeaturedContent {
  id: string;
  targetType: 'design' | 'designer' | 'printer';
  targetId: number;
  createdAt: string;
}

/** Audit trail for admin moderation actions. */
export interface ModerationLogEntry {
  id: string;
  adminId: number;
  targetType: string;
  targetId: number | string;
  action: string;
  reason?: string;
  createdAt: string;
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface DesignAnalytics {
  designId: number;
  sales: number;
  views: number;
  engagement: number;
  conversion: number;
  revenue: number;
  trend: AnalyticsPoint[];
}

export interface PayoutRecord {
  id: string;
  designerId: number;
  amount: number;
  status: PayoutStatus;
  dueDate: string;
  reference: string;
}

export interface PlaceOrderPayload {
  paymentMethod: PaymentMethod;
  shippingAddress?: string;
}

export interface PaymentResponse {
  paymentUrl: string;
}

export interface ReviewPayload {
  comment: string;
  rating: number;
}

export interface AuthResponse {
  user?: {
    id: number;
    name: string;
    email: string;
    address?: string;
    role: string;
    avatar?: string;
  };
  success?: boolean;
}

export interface ApiDesign {
  id: number;
  title: string;
  image: string;
  designer: {
    id: number;
    name: string;
    avatar: string;
    rank: string;
  };
  category: string;
  rating: number;
  sales: number;
  price: number;
}

export interface ApiProduct {
  id: number;
  name: string;
  image: string;
  colors?: string[];
}

export interface ApiOrder {
  id: number | string;
  status: string;
  date: string;
  total: number;
}
