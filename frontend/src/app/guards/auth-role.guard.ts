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
  if (!allowedRoles.includes(user.role)) return router.parseUrl(auth.dashboardPath(user.role));
  return true;
};
