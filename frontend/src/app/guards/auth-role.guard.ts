import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { UserRole } from '../models/types';

const allRoles: UserRole[] = ['customer', 'designer', 'printer', 'admin'];

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
