import { Router } from '@angular/router';
import { AuthContext } from '../auth/auth.context';

let handling = false;

export function handleUnauthorized(auth: AuthContext, router: Router) {
	if (handling) return;
	handling = true;

	auth.logout();

	router.navigate(['/auth']).finally(() => handling = false);
}
