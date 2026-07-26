import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-verification-pending-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page" style="padding-block:60px 40px;">
      <div style="max-width:620px; margin:0 auto; text-align:center; border:1px solid var(--pm-rule-strong); padding:44px 32px;">
        <p class="kicker kicker-clay" style="margin-bottom:14px;">Account verification</p>
        <h1 class="display" style="font-size:clamp(28px, 4vw, 44px); margin:0;">
          Your {{ roleLabel() }} account is<br /><em>pending verification.</em>
        </h1>
        <p class="serif-italic" style="font-size:16px; color:var(--pm-text-muted); margin-top:16px; line-height:1.6;">
          For trust and quality, Printymand verifies every designer and pressroom before
          granting full access. An administrator will review your identity and approve
          your account shortly. You'll be able to use your workspace once verified.
        </p>

        <p style="margin-top:22px;">
          <span class="status-pill pending">Status: {{ status() }}</span>
        </p>

        <div style="margin-top:28px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
          <a routerLink="/marketplace" class="btn btn-ghost">Browse the archive</a>
          <button type="button" class="btn btn-clay" (click)="logout()">Log out <span class="ar">→</span></button>
        </div>
      </div>
    </section>
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
