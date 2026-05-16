import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="pm-page">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="pm-kicker mb-1">Activity</p>
          <h1 class="pm-heading font-bold text-3xl" style="color:var(--pm-text);">Notifications</h1>
          <p class="text-sm mt-1" style="color:var(--pm-text-muted);">Order requests, payments, fulfillment and account updates.</p>
        </div>
        @if (notifications().length) {
          <button type="button" class="pm-btn pm-btn-secondary text-sm" (click)="markAll()">Mark all as read</button>
        }
      </div>

      <div class="pm-panel" style="padding:1rem;">
        @if (notifications().length) {
          <div style="display:grid; gap:0.5rem;">
            @for (n of notifications(); track n.id) {
              <a
                [routerLink]="n.link || null"
                style="display:flex; align-items:flex-start; gap:0.875rem; padding:0.875rem 1rem; border:1px solid var(--pm-border); border-radius:var(--pm-radius); text-decoration:none;"
                [style.background]="n.read ? 'var(--pm-surface)' : 'var(--pm-primary-soft)'"
                (click)="open(n.id)"
              >
                <span
                  style="width:0.5rem; height:0.5rem; border-radius:999px; margin-top:0.4rem; flex-shrink:0;"
                  [style.background]="n.read ? 'var(--pm-border)' : 'var(--pm-primary)'"
                ></span>
                <div style="flex:1; min-width:0;">
                  <p style="font-size:var(--pm-text-sm); color:var(--pm-text);">{{ n.message }}</p>
                  <p style="font-size:var(--pm-text-xs); color:var(--pm-text-muted); margin-top:0.2rem;">
                    {{ n.type }} · {{ n.createdAt | slice:0:10 }}
                  </p>
                </div>
              </a>
            }
          </div>
        } @else {
          <div class="pm-empty" style="padding:3rem 1.5rem;">
            <p style="font-size:var(--pm-text-sm); color:var(--pm-text-muted);">No notifications yet.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class NotificationsPageComponent {
  private readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);

  readonly notifications = computed(() => this.workflow.currentUserNotifications());

  open(id: number): void {
    this.workflow.markNotificationRead(id);
  }

  markAll(): void {
    const user = this.auth.user();
    if (user) this.workflow.markAllNotificationsRead(user.id);
  }
}
