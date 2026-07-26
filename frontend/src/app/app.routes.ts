import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout.component';
import { HomePageComponent } from './pages/home.page';
import { MarketplacePageComponent } from './pages/marketplace.page';
import { ProductsPageComponent } from './pages/products.page';
import { DesignDetailPageComponent } from './pages/design-detail.page';
import { LoginPageComponent } from './pages/login.page';
import { RegisterPageComponent } from './pages/register.page';
import { CustomizePageComponent } from './pages/customize.page';
import { PrinterSelectionPageComponent } from './pages/printer-selection.page';
import { CheckoutPageComponent } from './pages/checkout.page';
import { OrderTrackingPageComponent } from './pages/order-tracking.page';
import { CustomerDashboardPageComponent } from './pages/customer-dashboard.page';
import { CustomerProfilePageComponent } from './pages/customer-profile.page';
import { DesignerDashboardPageComponent } from './pages/designer-dashboard.page';
import { DesignerProfilePageComponent } from './pages/designer-profile.page';
import { PrinterDashboardPageComponent } from './pages/printer-dashboard.page';
import { PrinterProfilePageComponent } from './pages/printer-profile.page';
import { AdminDashboardPageComponent } from './pages/admin-dashboard.page';
import { AdminProfilePageComponent } from './pages/admin-profile.page';
import { UploadDesignPageComponent } from './pages/upload-design.page';
import { VerificationPendingPageComponent } from './pages/verification-pending.page';
import { NotificationsPageComponent } from './pages/notifications.page';
import { StorefrontPageComponent } from './pages/storefront.page';
import { NotFoundPageComponent } from './pages/not-found.page';
import { authRoleGuard, pendingVerificationGuard } from './guards/auth-role.guard';
import type { UserRole } from './models/types';

/** Roles allowed to place an order. Printers fulfil orders; they do not buy. */
const BUYER_ROLES: UserRole[] = ['customer', 'designer', 'admin'];

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'marketplace', component: MarketplacePageComponent },
      { path: 'products', component: ProductsPageComponent },
      { path: 'design/:id', component: DesignDetailPageComponent },
      { path: 'storefront/:id', component: StorefrontPageComponent },
      { path: 'login', component: LoginPageComponent },
      { path: 'register', component: RegisterPageComponent },
      { path: 'verification-pending', component: VerificationPendingPageComponent, canActivate: [pendingVerificationGuard] },
      // Personal artwork upload is a buying flow: printers cannot order, and a
      // designer publishing work uses the designer dashboard wizard instead.
      { path: 'upload-design', component: UploadDesignPageComponent, canActivate: [authRoleGuard(['customer', 'admin'])] },
      { path: 'customize/:id', component: CustomizePageComponent, canActivate: [authRoleGuard(BUYER_ROLES)] },
      { path: 'printers/:id', component: PrinterSelectionPageComponent, canActivate: [authRoleGuard(BUYER_ROLES)] },
      { path: 'checkout', component: CheckoutPageComponent, canActivate: [authRoleGuard(BUYER_ROLES)] },
      { path: 'cart', component: CheckoutPageComponent, canActivate: [authRoleGuard(BUYER_ROLES)] },
      // Shared across roles by design — a printer opens tracking for their jobs.
      { path: 'tracking/:orderId', component: OrderTrackingPageComponent, canActivate: [authRoleGuard()] },
      { path: 'notifications', component: NotificationsPageComponent, canActivate: [authRoleGuard()] },
      // Customer-shaped pages: other roles are redirected to their own workspace.
      { path: 'dashboard', component: CustomerDashboardPageComponent, canActivate: [authRoleGuard(['customer', 'admin'])] },
      { path: 'profile', component: CustomerProfilePageComponent, canActivate: [authRoleGuard(['customer', 'admin'])] },
      { path: 'designer-dashboard', component: DesignerDashboardPageComponent, canActivate: [authRoleGuard(['designer'])] },
      { path: 'designer-profile', component: DesignerProfilePageComponent, canActivate: [authRoleGuard(['designer'])] },
      { path: 'printer-dashboard', component: PrinterDashboardPageComponent, canActivate: [authRoleGuard(['printer'])] },
      { path: 'printer-profile', component: PrinterProfilePageComponent, canActivate: [authRoleGuard(['printer'])] },
      { path: 'admin', component: AdminDashboardPageComponent, canActivate: [authRoleGuard(['admin'])] },
      { path: 'admin-profile', component: AdminProfilePageComponent, canActivate: [authRoleGuard(['admin'])] },
      { path: '**', component: NotFoundPageComponent },
    ],
  },
];
