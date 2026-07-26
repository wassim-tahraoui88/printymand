import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { UserRole } from '../models/types';

const allRoles: UserRole[] = ['customer', 'designer', 'printer', 'admin'];

/**
 * Require a signed-in user, optionally restricted to specific roles.
 *
 * Pass an explicit role list for anything role-specific: omitting it means
 * "any signed-in user", which is only correct for genuinely shared pages
 * (notifications, order tracking).
 */
export const authRoleGuard = (allowedRoles: UserRole[] = allRoles): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (!user) return router.parseUrl('/login');
  // Spec: designers/printers have no full access until an admin verifies them.
  const status = user.accountStatus ?? (user.suspended ? 'SUSPENDED' : 'ACTIVE');
  if (status !== 'ACTIVE' && (user.role === 'designer' || user.role === 'printer')) {
    return router.parseUrl('/verification-pending');
  }
  if (!allowedRoles.includes(user.role)) return router.parseUrl(auth.dashboardPath(user.role));
  return true;
};

/**
 * Keep verified users off /verification-pending — it is only meaningful for an
 * account that is actually pending, and was previously reachable by anyone.
 */
export const pendingVerificationGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (!user) return router.parseUrl('/login');
  return auth.isVerified() ? router.parseUrl(auth.dashboardPath(user.role)) : true;
};
