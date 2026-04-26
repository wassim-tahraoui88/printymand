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
  readonly draft = this.store.customizationDraft;
  readonly currentCart = computed<Cart>(() => this.store.currentCart());
  readonly currentOrders = computed<Order[]>(() => this.store.currentUserOrders());

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

  createCartPayloadFromDraft(draft: CustomizationDraft) {
    return this.store.createCartPayloadFromDraft(draft);
  }

  addDraftToCart(userId: number) {
    return this.store.addDraftToCart(userId);
  }

  cartForUser(userId: number) {
    return this.store.cartForUser(userId);
  }

  removeCartLine(userId: number, lineId: number): void {
    this.store.removeCartItem(userId, lineId);
  }

  placeOrderForUser(userId: number, payload: PlaceOrderPayload) {
    return this.store.placeOrder(userId, payload);
  }

  initiatePayment(orderId: number | string) {
    return this.store.startPayment(orderId);
  }

  markPaymentPaid(orderId: number | string): void {
    this.store.markOrderPaymentStatus(orderId, 'paid');
  }

  submitReview(orderId: number | string, customerId: number, review: ReviewPayload) {
    return this.store.submitReview(orderId, customerId, review);
  }

  getOrderById(orderId: number | string) {
    return this.store.getOrderById(orderId);
  }

  getOrderStatus(order: Order): OrderLineStatus {
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

  printerTotals(printerUserId: number) {
    return this.store.printerTotals(printerUserId);
  }

  adminOverview() {
    return this.store.adminOverview();
  }

  addOrUpdateDesign(input: Partial<Design> & Pick<Design, 'title' | 'image' | 'category' | 'description' | 'price'>, designerId: number) {
    return this.store.addOrUpdateDesign(input, designerId);
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

  addOrUpdateProduct(input: Partial<Product> & Pick<Product, 'name' | 'category' | 'description' | 'basePrice' | 'colors' | 'sizes' | 'images' | 'availability' | 'leadTimeDays'>, printerUserId: number) {
    return this.store.addOrUpdateProduct(input, printerUserId);
  }

  advanceOrderLineStatus(orderId: number | string, lineId: number) {
    this.store.advanceOrderLineStatus(orderId, lineId);
  }

  setOrderLineStatus(orderId: number | string, lineId: number, status: OrderLineStatus) {
    this.store.setOrderLineStatus(orderId, lineId, status);
  }
}
