import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { mapHttpError } from './api-error.mapper';
import { handleUnauthorized } from './unauthorized.handler';
import { AuthContext } from '../auth/auth.context';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
	const auth = inject(AuthContext);
	const router = inject(Router);

	return next(req).pipe(catchError(err => {
		const apiError = mapHttpError(err);

		if (apiError.type === 'Unauthorized') handleUnauthorized(auth, router);

		return throwError(() => mapHttpError(err));
	}));
};
