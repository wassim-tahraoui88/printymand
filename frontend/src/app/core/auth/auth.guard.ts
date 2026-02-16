import { inject } from '@angular/core';
import { Router, CanActivateFn, CanActivateChildFn } from '@angular/router';
import { AuthContext } from './auth.context';

export const authGuard: CanActivateFn = async () => {
	const auth = inject(AuthContext);
	const router = inject(Router);

	if (auth.isAuthenticated()) return true;

	await router.navigate(['/auth']);
	return false;
};

export const authChildGuard: CanActivateChildFn = async () => {
	const auth = inject(AuthContext);
	const router = inject(Router);

	if (auth.isAuthenticated()) return true;

	await router.navigate(['/auth']);
	return false;
};