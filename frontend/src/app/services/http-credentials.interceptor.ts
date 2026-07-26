import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Single place where session cookies are attached to backend calls.
 * `ApiService` therefore passes no per-request credential options.
 */
export const httpCredentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ withCredentials: true }));
