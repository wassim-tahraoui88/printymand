import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { DesignerBadgeComponent } from '../components/rank-badge.component';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

/**
 * Public designer storefront (TeePublic-style): banner, designer identity,
 * bio / links and a grid of their approved marketplace designs. No auth needed.
 */
@Component({
  selector: 'app-storefront-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DesignCardComponent, DesignerBadgeComponent],
  template: `
    @if (designer(); as d) {
      <div>
        <!-- Banner -->
        <div
          style="height:200px; background:linear-gradient(135deg,var(--pm-primary),var(--pm-primary-deep)); background-size:cover; background-position:center; position:relative;"
          [style.background-image]="d.designerProfile?.banner ? 'url(' + d.designerProfile?.banner + ')' : null"
        ></div>

        <div class="page" style="margin-top:-3.5rem; position:relative;">
          <!-- Identity card -->
          <div style="background:var(--pm-surface); border:1px solid var(--pm-rule-strong); padding:24px; display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
            <div
              style="width:5rem; height:5rem; border-radius:50%; background:var(--pm-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.75rem; font-weight:800; font-family:'Plus Jakarta Sans',sans-serif; flex-shrink:0; border:3px solid var(--pm-surface); overflow:hidden;"
            >
              @if (d.designerProfile?.profilePicture || d.avatar) {
                <img [src]="d.designerProfile?.profilePicture || d.avatar" [alt]="d.name" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'" />
              } @else {
                {{ d.name.charAt(0).toUpperCase() }}
              }
            </div>
            <div style="flex:1; min-width:200px;">
              <div style="display:flex; align-items:center; gap:0.625rem; flex-wrap:wrap;">
                <h1 class="display" style="font-size:clamp(26px,3vw,40px);">{{ d.name }}</h1>
                <app-designer-badge [rank]="d.designerRank ?? 'Novice'" />
              </div>
              <p style="font-size:var(--pm-text-sm); color:var(--pm-text-muted); margin-top:0.375rem; line-height:1.6; max-width:60ch;">
                {{ d.designerProfile?.bio || 'Independent designer on Printymand.' }}
              </p>
              <div style="display:flex; gap:1.5rem; margin-top:0.875rem; flex-wrap:wrap;">
                <span style="font-size:var(--pm-text-sm); color:var(--pm-text);"><strong>{{ designs().length }}</strong> <span style="color:var(--pm-text-muted);">designs</span></span>
                <span style="font-size:var(--pm-text-sm); color:var(--pm-text);"><strong>{{ totalSales() }}</strong> <span style="color:var(--pm-text-muted);">sales</span></span>
                <span style="font-size:var(--pm-text-sm); color:var(--pm-text);"><strong>{{ d.designerRank ?? 'Novice' }}</strong> <span style="color:var(--pm-text-muted);">level</span></span>
              </div>
              @if (links().length) {
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.875rem;">
                  @for (link of links(); track link.url) {
                    <a [href]="link.url" target="_blank" rel="noopener" class="chip" style="text-decoration:none;">{{ link.label }}</a>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Designs grid -->
          <section style="margin:40px 0 64px;">
            <div class="section-head">
              <span class="section-no">↳</span>
              <hr class="line" />
              <span class="title">Designs by {{ d.name }}</span>
            </div>
            @if (isOwner()) {
              <p class="serif-italic" style="font-size:14px; color:var(--pm-text-muted); margin:-14px 0 22px;">
                This is your storefront. Click any design to edit its title, description, products and placement.
              </p>
            }
            @if (designs().length) {
              <div class="plate-grid">
                @for (design of designs(); track design.id) {
                  <app-design-card [design]="design" [ownerEditMode]="isOwner()" />
                }
              </div>
            } @else {
              <div style="padding:60px 0; text-align:center;">
                <p class="serif-italic" style="font-size:20px; color:var(--pm-text-muted);">This designer hasn't published any designs yet.</p>
              </div>
            }
          </section>
        </div>
      </div>
    } @else {
      <section class="page" style="padding-block:80px;">
        <div style="text-align:center;">
          <p class="serif-italic" style="font-size:22px; color:var(--pm-text-muted);">Storefront not found.</p>
          <a routerLink="/marketplace" class="btn btn-ghost" style="margin-top:18px;">← Browse marketplace</a>
        </div>
      </section>
    }
  `,
})
export class StorefrontPageComponent {
  private readonly store = inject(PlatformStoreService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly designerId = signal<number>(0);
  readonly designer = computed(() => {
    const u = this.store.getUserById(this.designerId());
    return u && u.role === 'designer' ? u : undefined;
  });
  /** The signed-in designer viewing their own storefront → editable cards. */
  readonly isOwner = computed(() => {
    const me = this.auth.user();
    return !!me && me.role === 'designer' && me.id === this.designerId();
  });
  readonly designs = computed(() =>
    this.isOwner()
      ? this.store.designsForDesigner(this.designerId()).filter((d) => !d.isUserUpload)
      : this.store.storefrontDesigns(this.designerId()),
  );
  readonly totalSales = computed(() => this.designs().reduce((sum, d) => sum + d.sales, 0));
  readonly links = computed(() => this.designer()?.designerProfile?.portfolioLinks ?? []);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designerId.set(Number(params.get('id') ?? 0));
    });
  }
}
