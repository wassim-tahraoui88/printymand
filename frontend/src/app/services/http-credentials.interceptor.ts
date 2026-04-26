import { HttpInterceptorFn } from '@angular/common/http';

export const httpCredentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(
    request.clone({
      withCredentials: true,
      credentials: 'include',
    }),
  );
