import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-verification-pending-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="pm-page">
      <div class="pm-panel" style="max-width:560px; margin:3rem auto; padding:2rem; text-align:center;">
        <p class="pm-kicker mb-1">Account verification</p>
        <h1 class="pm-heading" style="font-size:1.75rem; font-weight:800; color:var(--pm-text);">
          Your {{ roleLabel() }} account is pending verification
        </h1>
        <p style="font-size:var(--pm-text-base); color:var(--pm-text-muted); margin-top:0.75rem; line-height:1.7;">
          For trust and quality, Printymand verifies every designer and printer before
          granting full access. An administrator will review your identity and approve
          your account shortly. You'll be able to use your dashboard once verified.
        </p>

        <div style="margin-top:1.25rem; display:inline-flex; align-items:center; gap:0.5rem;
                    background:var(--pm-secondary-soft); border:1px solid rgba(232,158,28,0.25);
                    border-radius:var(--pm-radius); padding:0.625rem 1rem;">
          <span style="font-size:var(--pm-text-sm); font-weight:700; color:var(--pm-text);">
            Status: {{ status() }}
          </span>
        </div>

        <div style="margin-top:1.75rem; display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
          <a routerLink="/marketplace" class="pm-btn pm-btn-secondary">Browse marketplace</a>
          <button type="button" class="pm-btn pm-btn-primary" (click)="logout()">Log out</button>
        </div>
      </div>
    </div>
  `,
})
export class VerificationPendingPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly status = computed(() => this.auth.accountStatus());
  readonly roleLabel = computed(() => {
    const role = this.auth.user()?.role ?? 'account';
    return role.charAt(0).toUpperCase() + role.slice(1);
  });

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
