import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './layout.html',
})
export class LayoutComponent {
  readonly siteMenu   = signal(false);
  readonly userMenu   = signal(false);
  readonly searchQuery = signal('');
  readonly isScrolled  = signal(false);

  readonly currentYear = new Date().getFullYear();

  readonly navLinks = [
    { to: '/marketplace', label: 'Designs' },
    { to: '/products',    label: 'Products' },
  ] as const;

  readonly socials = [
    {
      label: 'Instagram',
      href: '#',
      path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z',
    },
    {
      label: 'Facebook',
      href: '#',
      path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    },
    {
      label: 'X / Twitter',
      href: '#',
      path: 'M4 4l16 16M4 20 20 4',
    },
  ] as const;

  // Cart now holds printer-accepted orders awaiting payment (new order flow).
  readonly cartCount = computed(() => this.workflow.currentAwaitingPaymentOrders().length);

  readonly theme = signal<'light' | 'dark'>(
    (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('pm-theme') as 'light' | 'dark')
      : null) ??
      (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'),
  );

  private readonly destroyRef = inject(DestroyRef);

  /** Unread in-app notifications for the signed-in user. */
  readonly unreadNotifications = computed(
    () => this.workflow.currentUserNotifications().filter((n) => !n.read).length,
  );

  constructor(
    public readonly auth: AuthService,
    public readonly workflow: WorkflowService,
    private readonly router: Router,
  ) {
    // Sync initial theme to DOM
    document.documentElement.dataset['theme'] = this.theme();

    // Close menus on navigation
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.siteMenu.set(false);
        this.userMenu.set(false);
      });

    // Scroll-aware nav backdrop
    if (typeof window !== 'undefined') {
      const onScroll = () => this.isScrolled.set(window.scrollY > 24);
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    document.documentElement.dataset['theme'] = next;
    localStorage.setItem('pm-theme', next);
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  handleSearch(): void {
    const value = this.searchQuery().trim();
    if (!value) return;
    this.router.navigate(['/marketplace'], { queryParams: { search: value } });
    this.searchQuery.set('');
    this.siteMenu.set(false);
  }

  profilePath(role: 'customer' | 'designer' | 'printer' | 'admin'): string {
    return (
      {
        customer: '/profile',
        designer: '/designer-profile',
        printer:  '/printer-profile',
        admin:    '/admin-profile',
      } as const
    )[role];
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.siteMenu.set(false);
    this.userMenu.set(false);
    this.router.navigateByUrl('/login');
  }

  userInitials(): string {
    const user = this.auth.user();
    if (!user) return 'P';
    return user.name
      .split(' ')
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('');
  }

  toggleSiteMenu(): void {
    this.siteMenu.update((v) => !v);
    this.userMenu.set(false);
  }
}
