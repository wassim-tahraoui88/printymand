import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
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
  readonly siteMenu = signal(false);
  readonly userMenu = signal(false);
  readonly searchQuery = signal('');
  readonly navLinks = [
    { to: '/marketplace', label: 'Designs' },
    { to: '/products', label: 'Products' },
  ] as const;
  readonly cartCount = computed(() => this.workflow.currentCart().items.length);
  readonly theme = signal<'light' | 'dark'>(
    (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('pm-theme') as 'light' | 'dark')
      : null) ??
      (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'),
  );
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public readonly auth: AuthService,
    public readonly workflow: WorkflowService,
    private readonly router: Router,
  ) {
    document.documentElement.dataset['theme'] = this.theme();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.siteMenu.set(false);
        this.userMenu.set(false);
      });
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
  }

  profilePath(role: 'customer' | 'designer' | 'printer' | 'admin'): string {
    return {
      customer: '/profile',
      designer: '/designer-profile',
      printer: '/printer-profile',
      admin: '/admin-profile',
    }[role];
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
    this.siteMenu.update((current) => !current);
    this.userMenu.set(false);
  }
}
