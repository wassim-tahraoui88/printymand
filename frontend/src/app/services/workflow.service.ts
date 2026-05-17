import { Injectable, computed, inject } from '@angular/core';
import type {
  Cart,
  CustomizationDraft,
  Design,
  DesignAnalytics,
  DesignProductConfiguration,
  Order,
  OrderLineStatus,
  PlaceOrderPayload,
  PrinterAvailability,
  PrinterPartner,
  Product,
  ReviewPayload,
} from '../models/types';
import { PlatformStoreService } from './platform-store.service';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly store = inject(PlatformStoreService);

  readonly categories = this.store.categories;
  readonly designs = this.store.designs;
  readonly products = this.store.products;
  readonly printers = this.store.printers;
  readonly orders = this.store.orders;
  readonly reviews = this.store.reviews;
  readonly payouts = this.store.payouts;
  readonly printerPayouts = this.store.printerPayouts;
  readonly notifications = this.store.notifications;
  readonly currentUserNotifications = this.store.currentUserNotifications;
  readonly featured = this.store.featured;
  readonly moderationLog = this.store.moderationLog;
  readonly platformSettings = this.store.platformSettings;
  readonly draft = this.store.customizationDraft;
  readonly currentCart = computed<Cart>(() => this.store.currentCart());
  readonly currentOrders = computed<Order[]>(() => this.store.currentUserOrders());

  getUserById(id: number) {
    return this.store.getUserById(id);
  }

  /** Public storefront designs for a designer: approved, active, non-upload. */
  storefrontDesigns(designerId: number): Design[] {
    return this.store
      .designsForDesigner(designerId)
      .filter((d) => d.status === 'ACTIVE' && (d.moderation ?? 'APPROVED') === 'APPROVED' && !d.isUserUpload);
  }

  getDesignById(id: number | string): Design | undefined {
    return this.store.getDesignById(id);
  }

  getProductById(id: number | string): Product | undefined {
    return this.store.getProductById(id);
  }

  getPrinterById(id: number | string): PrinterPartner | undefined {
    return this.store.getPrinterById(id);
  }

  getDesignConfig(designId: number, productId: number): DesignProductConfiguration | undefined {
    return this.store.getDesignConfig(designId, productId);
  }

  setDraft(draft: CustomizationDraft): void {
    this.store.setCustomizationDraft(draft);
  }

  clearDraft(): void {
    this.store.clearCustomizationDraft();
  }

  cartForUser(userId: number) {
    return this.store.cartForUser(userId);
  }

  removeCartLine(userId: number, lineId: number): void {
    this.store.removeCartItem(userId, lineId);
  }

  /** Spec: submit an order request (no payment until the printer accepts). */
  submitOrderRequest(userId: number, payload: PlaceOrderPayload) {
    return this.store.submitOrderRequest(userId, payload);
  }

  /** New flow: send the request straight from printer selection (no cart). */
  submitDraftOrderRequest(userId: number, shippingAddress?: string) {
    return this.store.submitDraftOrderRequest(userId, shippingAddress);
  }

  readonly currentAwaitingPaymentOrders = this.store.currentAwaitingPaymentOrders;

  awaitingPaymentOrdersForUser(userId: number) {
    return this.store.awaitingPaymentOrdersForUser(userId);
  }

  acceptOrderRequest(orderId: number | string) {
    return this.store.acceptOrderRequest(orderId);
  }

  rejectOrderRequest(orderId: number | string, reason?: string) {
    return this.store.rejectOrderRequest(orderId, reason);
  }

  cancelOrderRequest(orderId: number | string, userId: number) {
    return this.store.cancelOrderRequest(orderId, userId);
  }

  /** Customer pays an accepted order. */
  payForOrder(orderId: number | string) {
    return this.store.payForOrder(orderId);
  }

  setOrderShippingAddress(orderId: number | string, address: string) {
    this.store.setOrderShippingAddress(orderId, address);
  }

  setOrderPaymentMethod(orderId: number | string, method: 'paymee' | 'd17' | 'card' | 'cash') {
    this.store.setOrderPaymentMethod(orderId, method);
  }

  submitReview(
    orderId: number | string,
    customerId: number,
    review: ReviewPayload & { target: 'design' | 'printer'; designId?: number; printerId?: number },
  ) {
    return this.store.submitReview(orderId, customerId, review);
  }

  markNotificationRead(id: number) {
    this.store.markNotificationRead(id);
  }

  markAllNotificationsRead(userId: number) {
    this.store.markAllNotificationsRead(userId);
  }

  moderateDesign(adminId: number, designId: number, decision: 'APPROVED' | 'REJECTED', reason?: string) {
    this.store.moderateDesign(adminId, designId, decision, reason);
  }

  toggleFeatured(adminId: number, targetType: 'design' | 'designer' | 'printer', targetId: number) {
    this.store.toggleFeatured(adminId, targetType, targetId);
  }

  isFeatured(targetType: 'design' | 'designer' | 'printer', targetId: number) {
    return this.store.isFeatured(targetType, targetId);
  }

  requestDesignerPayout(userId: number) {
    return this.store.requestDesignerPayout(userId);
  }

  printerPayoutsForUser(printerUserId: number) {
    return this.store.printerPayoutsForUser(printerUserId);
  }

  // ── Global catalog (admin) + printer offerings ──
  readonly offerings = this.store.offerings;

  addOrUpdateGlobalProduct(
    input: Partial<Product> & Pick<Product, 'name' | 'category' | 'description' | 'basePrice' | 'colors' | 'sizes' | 'images'>,
  ) {
    return this.store.addOrUpdateGlobalProduct(input);
  }

  removeGlobalProduct(productId: number) {
    this.store.removeGlobalProduct(productId);
  }

  offeringsForPrinterUser(printerUserId: number) {
    return this.store.offeringsForPrinterUser(printerUserId);
  }

  getOffering(printerId: number, productId: number) {
    return this.store.getOffering(printerId, productId);
  }

  offeringPrice(printerId: number, productId: number) {
    return this.store.offeringPrice(printerId, productId);
  }

  printersForProduct(productId: number) {
    return this.store.printersForProduct(productId);
  }

  setPrinterOffering(printerUserId: number, productId: number, basePrice: number, available: boolean, description?: string) {
    return this.store.setPrinterOffering(printerUserId, productId, basePrice, available, description);
  }

  removePrinterOffering(printerUserId: number, productId: number) {
    this.store.removePrinterOffering(printerUserId, productId);
  }

  allDesigns() {
    return this.store.designs();
  }

  getOrderById(orderId: number | string) {
    return this.store.getOrderById(orderId);
  }

  getOrderStatus(order: Order): string {
    return this.store.getOrderStatus(order);
  }

  buildOrderTimeline(order: Order) {
    return this.store.buildOrderTimeline(order);
  }

  designsForDesigner(designerId: number) {
    return this.store.designsForDesigner(designerId);
  }

  linesForDesigner(designerId: number) {
    return this.store.linesForDesigner(designerId);
  }

  designerAnalytics(designerId: number): DesignAnalytics[] {
    return this.store.designerAnalytics(designerId);
  }

  designerTotals(designerId: number) {
    return this.store.designerTotals(designerId);
  }

  productsForPrinterUser(printerUserId: number) {
    return this.store.productsForPrinterUser(printerUserId);
  }

  linesForPrinterUser(printerUserId: number) {
    return this.store.linesForPrinterUser(printerUserId);
  }

  ordersAwaitingPrinter(printerUserId: number) {
    return this.store.ordersAwaitingPrinter(printerUserId);
  }

  fulfillmentLinesForPrinter(printerUserId: number) {
    return this.store.fulfillmentLinesForPrinter(printerUserId);
  }

  canceledOrdersForPrinter(printerUserId: number) {
    return this.store.canceledOrdersForPrinter(printerUserId);
  }

  printerTotals(printerUserId: number) {
    return this.store.printerTotals(printerUserId);
  }

  adminOverview() {
    return this.store.adminOverview();
  }

  addOrUpdateDesign(input: Partial<Design> & Pick<Design, 'title' | 'image' | 'category' | 'description'>, designerId: number) {
    return this.store.addOrUpdateDesign(input, designerId);
  }

  createUploadedDesign(userId: number, input: { title: string; image: string }) {
    return this.store.createUploadedDesign(userId, input);
  }

  marketplaceDesigns() {
    return this.store.marketplaceDesigns();
  }

  setPrinterAvailability(printerUserId: number, availability: PrinterAvailability) {
    this.store.setPrinterAvailability(printerUserId, availability);
  }

  getPrinterByUserId(userId: number) {
    return this.store.getPrinterByUserId(userId);
  }

  updatePlatformSettings(updates: Partial<{ margin: number; designerRoyalty: number; payoutThreshold: number; categories: string[] }>) {
    this.store.updatePlatformSettings(updates);
  }

  setDesignStatus(designId: number, status: Design['status']) {
    this.store.setDesignStatus(designId, status);
  }

  assignProductsToDesign(designId: number, productIds: number[]) {
    this.store.assignProductsToDesign(designId, productIds);
  }

  saveDesignProductConfiguration(designId: number, config: DesignProductConfiguration) {
    this.store.saveDesignProductConfiguration(designId, config);
  }

  availableProductsForDesign(designId: number) {
    return this.store.availableProductsForDesign(designId);
  }

  availableDesignsForProduct(productId: number) {
    return this.store.availableDesignsForProduct(productId);
  }


  advanceOrderLineStatus(orderId: number | string, lineId: number) {
    this.store.advanceOrderLineStatus(orderId, lineId);
  }

  setOrderLineStatus(orderId: number | string, lineId: number, status: OrderLineStatus) {
    this.store.setOrderLineStatus(orderId, lineId, status);
  }
}
