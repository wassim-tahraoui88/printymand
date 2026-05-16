import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ApiDesign,
  ApiOrder,
  ApiProduct,
  AuthResponse,
  Cart,
  CartItemPayload,
  CursorPaginationParams,
  LoginPayload,
  OffsetPaginationParams,
  PaginatedOrders,
  PaginatedResponse,
  PaymentResponse,
  PlaceOrderPayload,
  RegisterPayload,
  ReviewPayload,
} from '../models/types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  /** Backend base URL — configured per environment (see src/environments). */
  private readonly baseUrl = environment.apiBaseUrl;

  private buildParams(params?: Record<string, string | number | undefined>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }

  private requestOptions() {
    return {
      withCredentials: true,
      credentials: 'include' as const,
    };
  }

  getDesigns(params: CursorPaginationParams = {}): Promise<PaginatedResponse<ApiDesign>> {
    const query = this.buildParams({
      cursor: params.cursor,
      limit: params.limit ?? 20,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection as string | undefined,
      ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
    });
    return firstValueFrom(this.http.get<PaginatedResponse<ApiDesign>>(`${this.baseUrl}/designs`, { params: query, ...this.requestOptions() }));
  }

  getDesign(id: number | string): Promise<ApiDesign> {
    return firstValueFrom(this.http.get<ApiDesign>(`${this.baseUrl}/designs/${id}`, this.requestOptions()));
  }

  getDesignUploadConfig(): Promise<unknown> {
    return firstValueFrom(this.http.get(`${this.baseUrl}/designs/upload`, this.requestOptions()));
  }

  uploadDesign(formData: FormData): Promise<unknown> {
    return firstValueFrom(this.http.post(`${this.baseUrl}/designs/upload`, formData, this.requestOptions()));
  }

  getProducts(params: CursorPaginationParams = {}): Promise<PaginatedResponse<ApiProduct>> {
    const query = this.buildParams({
      cursor: params.cursor,
      limit: params.limit ?? 20,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection as string | undefined,
      ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
    });
    return firstValueFrom(this.http.get<PaginatedResponse<ApiProduct>>(`${this.baseUrl}/products`, { params: query, ...this.requestOptions() }));
  }

  getProduct(id: number | string): Promise<ApiProduct> {
    return firstValueFrom(this.http.get<ApiProduct>(`${this.baseUrl}/products/${id}`, this.requestOptions()));
  }

  addToCart(payload: CartItemPayload): Promise<Cart> {
    return firstValueFrom(this.http.patch<Cart>(`${this.baseUrl}/cart`, payload, this.requestOptions()));
  }

  getCart(): Promise<Cart> {
    return firstValueFrom(this.http.get<Cart>(`${this.baseUrl}/cart`, this.requestOptions()));
  }

  placeOrder(payload: PlaceOrderPayload): Promise<{ orderId: number | string }> {
    return firstValueFrom(this.http.post<{ orderId: number | string }>(`${this.baseUrl}/cart`, payload, this.requestOptions()));
  }

  initiatePayment(orderId: number | string): Promise<PaymentResponse> {
    return firstValueFrom(this.http.post<PaymentResponse>(`${this.baseUrl}/payment/${orderId}`, {}, this.requestOptions()));
  }

  getOrders(params: OffsetPaginationParams = {}): Promise<PaginatedOrders<ApiOrder>> {
    const query = this.buildParams({
      offset: params.offset ?? 0,
      limit: params.limit ?? 20,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection as string | undefined,
      ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
    });
    return firstValueFrom(this.http.get<PaginatedOrders<ApiOrder>>(`${this.baseUrl}/orders`, { params: query, ...this.requestOptions() }));
  }

  getOrder(id: number | string): Promise<ApiOrder> {
    return firstValueFrom(this.http.get<ApiOrder>(`${this.baseUrl}/orders/${id}`, this.requestOptions()));
  }

  login(payload: LoginPayload): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${this.baseUrl}/users/login`, payload, this.requestOptions()));
  }

  register(payload: RegisterPayload): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${this.baseUrl}/users/register`, payload, this.requestOptions()));
  }

  logout(): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/users/logout`, {}, this.requestOptions()));
  }

  getMe(): Promise<AuthResponse['user']> {
    return firstValueFrom(this.http.get<AuthResponse['user']>(`${this.baseUrl}/auth/me`, this.requestOptions()));
  }

  submitReview(orderId: number | string, review: ReviewPayload & { target?: string; designId?: number; printerId?: number }): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/reviews/${orderId}`, review, this.requestOptions()));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Backend integration contract (spec "Order Flow (Revised)" + ER model).
  // These map 1:1 to PlatformStoreService mutations. When the NestJS backend is
  // ready, set environment.useRealApi=true and implement these endpoints; the
  // mock store already calls the relevant ones in try/catch.
  // ───────────────────────────────────────────────────────────────────────────

  /** Spec step 1-2: submit an order request (no payment yet). */
  submitOrderRequest(payload: PlaceOrderPayload): Promise<{ orderId: number | string }> {
    return firstValueFrom(this.http.post<{ orderId: number | string }>(`${this.baseUrl}/order-requests`, payload, this.requestOptions()));
  }

  /** Spec step 3: printer accepts a request. */
  acceptOrderRequest(orderId: number | string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/order-requests/${orderId}/accept`, {}, this.requestOptions()));
  }

  /** Spec step 3: printer rejects a request. */
  rejectOrderRequest(orderId: number | string, reason?: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/order-requests/${orderId}/reject`, { reason }, this.requestOptions()));
  }

  /** Customer cancels a request before the printer decides. */
  cancelOrderRequest(orderId: number | string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/order-requests/${orderId}/cancel`, {}, this.requestOptions()));
  }

  /** Spec step 4-5: pay an accepted order. */
  payOrder(orderId: number | string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/orders/${orderId}/pay`, {}, this.requestOptions()));
  }

  /** Printer fulfillment progression (Confirmed → Printing → Shipped → Delivered). */
  updateOrderLineStatus(orderId: number | string, lineId: number, status: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/orders/${orderId}/lines/${lineId}`, { status }, this.requestOptions()));
  }

  // ── Profiles ──
  saveDesignerProfile(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/profiles/designer`, payload, this.requestOptions()));
  }
  savePrinterProfile(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/profiles/printer`, payload, this.requestOptions()));
  }
  saveCustomerProfile(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/profiles/customer`, payload, this.requestOptions()));
  }
  setPrinterAvailability(status: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/profiles/printer/availability`, { status }, this.requestOptions()));
  }

  // ── Printer products (offerings) ──
  savePrinterProduct(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/printer-products`, payload, this.requestOptions()));
  }
  deletePrinterProduct(productId: number): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.delete<{ success: boolean }>(`${this.baseUrl}/printer-products/${productId}`, this.requestOptions()));
  }

  // ── Designs & moderation ──
  saveDesign(payload: unknown): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(`${this.baseUrl}/designs`, payload, this.requestOptions()));
  }
  moderateDesign(designId: number, decision: string, reason?: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/admin/designs/${designId}/moderate`, { decision, reason }, this.requestOptions()));
  }

  // ── Payouts ──
  requestDesignerPayout(): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/payouts/designer/request`, {}, this.requestOptions()));
  }
  getPayouts(): Promise<unknown> {
    return firstValueFrom(this.http.get(`${this.baseUrl}/payouts`, this.requestOptions()));
  }

  // ── Notifications ──
  getNotifications(): Promise<unknown> {
    return firstValueFrom(this.http.get(`${this.baseUrl}/notifications`, this.requestOptions()));
  }
  markNotificationRead(id: number): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/notifications/${id}/read`, {}, this.requestOptions()));
  }

  // ── Admin ──
  setAccountStatus(userId: number, status: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/admin/users/${userId}/status`, { status }, this.requestOptions()));
  }
  updatePlatformSettings(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/admin/platform-settings`, payload, this.requestOptions()));
  }
  toggleFeatured(targetType: string, targetId: number): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/admin/featured`, { targetType, targetId }, this.requestOptions()));
  }
}
