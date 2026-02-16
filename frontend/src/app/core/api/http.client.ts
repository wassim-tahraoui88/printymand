import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiErrorInterceptor } from './http-error.interceptor';

export const httpClientProviders = [
	provideHttpClient(
		withInterceptors([apiErrorInterceptor])
	)
];
