import { inject } from '@angular/core';
import { AuthContext } from './auth/auth.context';

export function appInitializer() {
	const auth = inject(AuthContext);
	auth.refresh();
}
