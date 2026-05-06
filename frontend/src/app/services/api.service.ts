import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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
  private readonly baseUrl = '/api/v1';

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

  submitReview(orderId: number | string, review: ReviewPayload): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.post<{ success: boolean }>(`${this.baseUrl}/reviews/${orderId}`, review, this.requestOptions()));
  }
}
