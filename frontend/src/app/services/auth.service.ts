import { Injectable, computed, inject } from '@angular/core';
import { demoAccounts } from '../data/mock';
import type {
  Address,
  CustomerProfile,
  DesignerProfile,
  DesignerRank,
  PaymentPreference,
  PrinterProfile,
  PrinterRank,
  RegisterData,
  User,
  UserRole,
} from '../models/types';
import { PlatformStoreService } from './platform-store.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(PlatformStoreService);

  readonly user = computed(() => this.store.currentUser());
  readonly users = computed(() => this.store.users());
  readonly isAuthenticated = computed(() => !!this.store.currentUser());
  readonly backendMode = computed(() => this.store.backendMode());
  readonly demoAccounts = demoAccounts;

  readonly dashboardMap: Record<UserRole, string> = {
    customer: '/dashboard',
    designer: '/designer-dashboard',
    printer: '/printer-dashboard',
    admin: '/admin',
  };

  login(email: string, password: string) {
    return this.store.login(email, password);
  }

  register(data: RegisterData) {
    return this.store.register(data);
  }

  logout() {
    return this.store.logout();
  }

  updateProfile(updates: Partial<Pick<User, 'name' | 'email' | 'address' | 'avatar'>>): void {
    const user = this.user();
    if (!user) return;
    this.store.updateUserBasics(user.id, updates);
  }

  updateCustomerProfile(updates: Partial<CustomerProfile>): void {
    const user = this.user();
    if (!user) return;
    this.store.saveCustomerProfile(user.id, updates);
  }

  updateDesignerProfile(updates: Partial<DesignerProfile>): void {
    const user = this.user();
    if (!user) return;
    this.store.saveDesignerProfile(user.id, updates);
  }

  updatePrinterProfile(updates: Partial<PrinterProfile>): void {
    const user = this.user();
    if (!user) return;
    this.store.savePrinterProfile(user.id, updates);
  }

  saveAddress(address: Omit<Address, 'id'> & Partial<Pick<Address, 'id'>>): void {
    const user = this.user();
    if (!user) return;
    this.store.upsertAddress(user.id, address);
  }

  removeAddress(addressId: number): void {
    const user = this.user();
    if (!user) return;
    this.store.removeAddress(user.id, addressId);
  }

  savePaymentPreference(preference: Omit<PaymentPreference, 'id'> & Partial<Pick<PaymentPreference, 'id'>>): void {
    const user = this.user();
    if (!user) return;
    this.store.upsertPaymentPreference(user.id, preference);
  }

  updateUserRole(userId: number, role: UserRole): void {
    this.store.updateUserRole(userId, role);
  }

  updateDesignerRank(userId: number, rank: DesignerRank): void {
    this.store.updateDesignerRank(userId, rank);
  }

  updatePrinterRank(userId: number, rank: PrinterRank): void {
    this.store.updatePrinterRank(userId, rank);
  }

  toggleUserSuspended(userId: number): void {
    this.store.toggleUserSuspended(userId);
  }

  dashboardPath(role: UserRole): string {
    return this.dashboardMap[role];
  }
}
