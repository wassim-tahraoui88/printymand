export type UserRole = 'customer' | 'designer' | 'printer' | 'admin';

export type DesignerRank = 'Novice' | 'Rising' | 'Artisan' | 'Elite';
export type PrinterRank = 'Verified' | 'Gold' | 'Premium';

export type DesignStatus = 'ACTIVE' | 'ARCHIVED' | 'REMOVED';
export type ProductAvailability = 'ACTIVE' | 'PAUSED' | 'DRAFT';
export type OrderLineStatus = 'Pending' | 'Accepted' | 'Printing' | 'Shipped' | 'Delivered' | 'Rejected';
export type PaymentMethod = 'cash' | 'd17' | 'card';
export type PaymentStatus = 'pending' | 'processing' | 'paid';

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
}

export interface PrinterProfile {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  governorate: string;
  about: string;
  productionMethods: string[];
  coverageZones: string[];
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
  price: number;
  status: DesignStatus;
  assignedProductIds: number[];
  productConfigurations: DesignProductConfiguration[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  printerId: number;
  printerName: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  images: string[];
  availability: ProductAvailability;
  leadTimeDays: number;
  rating: number;
  totalOrders: number;
  assignedDesignIds: number[];
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
  status: 'scheduled' | 'processing' | 'paid';
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
