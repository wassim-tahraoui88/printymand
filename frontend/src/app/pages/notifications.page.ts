import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page" style="padding-block:38px 28px;">
      <div class="desk-header">
        <div style="flex:1; min-width:0;">
          <p class="kicker kicker-clay" style="margin-bottom:10px;">Activity</p>
          <h1 class="h-title">Notifications.</h1>
        </div>
        <div class="h-meta">
          <span>Order requests, payments, fulfillment</span>
          @if (notifications().length) {
            <div style="margin-top:10px;">
              <button type="button" class="btn btn-ghost" style="font-size:11px; padding:8px 14px;" (click)="markAll()">
                Mark all as read
              </button>
            </div>
          }
        </div>
      </div>

      @if (notifications().length) {
        <div style="display:grid; gap:10px;">
          @for (n of notifications(); track n.id) {
            <a
              [routerLink]="n.link || null"
              style="display:flex; align-items:flex-start; gap:14px; padding:16px 18px; border:1px solid var(--pm-rule); text-decoration:none; color:inherit;"
              [style.border-left]="n.read ? null : '3px solid var(--pm-clay)'"
              [style.background]="n.read ? 'transparent' : 'var(--pm-surface-alt)'"
              (click)="open(n.id)"
            >
              <div style="flex:1; min-width:0;">
                <p style="font-family:var(--pm-font-sans); font-size:14px; color:var(--pm-ink); margin:0;">{{ n.message }}</p>
                <p class="serif-italic" style="font-size:12px; color:var(--pm-text-muted); margin:4px 0 0;">
                  {{ n.type }} · {{ n.createdAt | slice:0:10 }}
                </p>
              </div>
              @if (!n.read) {
                <span class="status-pill pending" style="flex-shrink:0;">New</span>
              }
            </a>
          }
        </div>
      } @else {
        <div style="padding:60px 0; text-align:center;">
          <p class="serif-italic" style="font-size:20px; color:var(--pm-text-muted);">No notifications yet.</p>
        </div>
      }
    </section>
  `,
})
export class NotificationsPageComponent {
  private readonly store = inject(PlatformStoreService);
  private readonly auth = inject(AuthService);

  readonly notifications = computed(() => this.store.currentUserNotifications());

  open(id: number): void {
    this.store.markNotificationRead(id);
  }

  markAll(): void {
    const user = this.auth.user();
    if (user) this.store.markAllNotificationsRead(user.id);
  }
}
