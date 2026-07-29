import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ApiDesign,
  ApiOrder,
  ApiProduct,
  AuthResponse,
  CursorPaginationParams,
  LoginPayload,
  OffsetPaginationParams,
  PaginatedOrders,
  PaginatedResponse,
  RegisterData,
  ReviewPayload,
} from '../models/types';

/**
 * Thin HTTP client for the NestJS backend.
 *
 * Credentials are attached by `httpCredentialsInterceptor` — no per-call options
 * are needed here. Whether these calls are made at all is decided by the caller
 * (PlatformStoreService.tryApi) based on `environment.useRealApi`.
 */
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

  // ── Catalog reads ──

  getDesigns(params: CursorPaginationParams = {}): Promise<PaginatedResponse<ApiDesign>> {
    const query = this.buildParams({
      cursor: params.cursor,
      limit: params.limit ?? 20,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection as string | undefined,
      ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
    });
    return firstValueFrom(this.http.get<PaginatedResponse<ApiDesign>>(`${this.baseUrl}/designs`, { params: query }));
  }

  getDesign(id: number | string): Promise<ApiDesign> {
    return firstValueFrom(this.http.get<ApiDesign>(`${this.baseUrl}/designs/${id}`));
  }

  getProducts(params: CursorPaginationParams = {}): Promise<PaginatedResponse<ApiProduct>> {
    const query = this.buildParams({
      cursor: params.cursor,
      limit: params.limit ?? 20,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection as string | undefined,
      ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
    });
    return firstValueFrom(this.http.get<PaginatedResponse<ApiProduct>>(`${this.baseUrl}/products`, { params: query }));
  }

  getProduct(id: number | string): Promise<ApiProduct> {
    return firstValueFrom(this.http.get<ApiProduct>(`${this.baseUrl}/products/${id}`));
  }

  // ── Orders ──

  getOrders(params: OffsetPaginationParams = {}): Promise<PaginatedOrders<ApiOrder>> {
    const query = this.buildParams({
      offset: params.offset ?? 0,
      limit: params.limit ?? 20,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection as string | undefined,
      ...(params.filter ? { filter: JSON.stringify(params.filter) } : {}),
    });
    return firstValueFrom(this.http.get<PaginatedOrders<ApiOrder>>(`${this.baseUrl}/orders`, { params: query }));
  }

  getOrder(id: number | string): Promise<ApiOrder> {
    return firstValueFrom(this.http.get<ApiOrder>(`${this.baseUrl}/orders/${id}`));
  }

  // ── Auth ──

  login(payload: LoginPayload): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${this.baseUrl}/users/login`, payload));
  }

  register(payload: RegisterData): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${this.baseUrl}/users/register`, payload));
  }

  logout(): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/users/logout`, {}));
  }

  getMe(): Promise<AuthResponse['user']> {
    return firstValueFrom(this.http.get<AuthResponse['user']>(`${this.baseUrl}/auth/me`));
  }

  // ── Reviews ──

  submitReview(
    orderId: number | string,
    review: ReviewPayload & { target?: string; designId?: number; printerId?: number },
  ): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/reviews/${orderId}`, review));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Order lifecycle (spec "Order Flow (Revised)"). Each maps 1:1 to a
  // PlatformStoreService mutation, which calls it through `tryApi`.
  // ───────────────────────────────────────────────────────────────────────────

  /** Spec step 1-2: submit an order request (no payment yet). */
  submitOrderRequest(payload: {
    paymentMethod: string;
    shippingAddress?: string;
  }): Promise<{ orderId: number | string }> {
    return firstValueFrom(this.http.post<{ orderId: number | string }>(`${this.baseUrl}/order-requests`, payload));
  }

  /** Spec step 3: printer accepts a request. */
  acceptOrderRequest(orderId: number | string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/order-requests/${orderId}/accept`, {}));
  }

  /** Spec step 3: printer rejects a request. */
  rejectOrderRequest(orderId: number | string, reason?: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/order-requests/${orderId}/reject`, { reason }));
  }

  /** Customer cancels a request before payment. */
  cancelOrderRequest(orderId: number | string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/order-requests/${orderId}/cancel`, {}));
  }

  /** Spec step 4-5: pay an accepted order. */
  payOrder(orderId: number | string, paymentMethod: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/orders/${orderId}/pay`, { paymentMethod }));
  }

  /** Printer fulfillment progression (Confirmed → Printing → Shipped → Delivered). */
  updateOrderLineStatus(orderId: number | string, lineId: number, status: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/orders/${orderId}/lines/${lineId}`, { status }));
  }

  // ── Profiles ──

  saveDesignerProfile(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/profiles/designer`, payload));
  }

  savePrinterProfile(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/profiles/printer`, payload));
  }

  saveCustomerProfile(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/profiles/customer`, payload));
  }

  setPrinterAvailability(status: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/profiles/printer/availability`, { status }));
  }

  // ── Printer products (offerings) ──

  savePrinterProduct(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/printer-products`, payload));
  }

  deletePrinterProduct(productId: number): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.delete<{ success: boolean }>(`${this.baseUrl}/printer-products/${productId}`));
  }

  // ── Designs & moderation ──

  saveDesign(payload: unknown): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(`${this.baseUrl}/designs`, payload));
  }

  moderateDesign(designId: number, decision: string, reason?: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/admin/designs/${designId}/moderate`, { decision, reason }));
  }

  setDesignStatus(designId: number, status: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/designs/${designId}/status`, { status }));
  }

  // ── Payouts ──

  requestDesignerPayout(): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/payouts/designer/request`, {}));
  }

  getPayouts(): Promise<unknown> {
    return firstValueFrom(this.http.get(`${this.baseUrl}/payouts`));
  }

  // ── Notifications ──

  getNotifications(): Promise<unknown> {
    return firstValueFrom(this.http.get(`${this.baseUrl}/notifications`));
  }

  markNotificationRead(id: number): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/notifications/${id}/read`, {}));
  }

  markAllNotificationsRead(): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/notifications/read-all`, {}));
  }

  // ── Admin ──

  setAccountStatus(userId: number, status: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.patch<{ success: boolean }>(`${this.baseUrl}/admin/users/${userId}/status`, { status }));
  }

  updatePlatformSettings(payload: unknown): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.put<{ success: boolean }>(`${this.baseUrl}/admin/platform-settings`, payload));
  }

  toggleFeatured(targetType: string, targetId: number): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/admin/featured`, { targetType, targetId }));
  }

  saveGlobalProduct(payload: unknown): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(`${this.baseUrl}/admin/products`, payload));
  }

  removeGlobalProduct(productId: number): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.delete<{ success: boolean }>(`${this.baseUrl}/admin/products/${productId}`));
  }
}
