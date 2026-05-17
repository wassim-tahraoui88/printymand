import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { DesignerBadgeComponent } from '../components/rank-badge.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

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

        <div class="pm-container" style="margin-top:-3.5rem; position:relative;">
          <!-- Identity card -->
          <div class="pm-panel" style="padding:1.5rem; display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap;">
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
                <h1 class="pm-display" style="font-size:clamp(1.5rem,3vw,2.25rem); color:var(--pm-text);">{{ d.name }}</h1>
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
                    <a [href]="link.url" target="_blank" rel="noopener" class="pm-chip" style="text-decoration:none;">{{ link.label }}</a>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Designs grid -->
          <section style="margin:2.5rem 0 4rem;">
            <h2 class="pm-heading" style="font-size:var(--pm-text-lg); font-weight:800; color:var(--pm-text); margin-bottom:0.5rem;">
              Designs by {{ d.name }}
            </h2>
            @if (isOwner()) {
              <p style="font-size:var(--pm-text-sm); color:var(--pm-text-muted); margin-bottom:1.25rem;">
                This is your storefront. Click any design to edit its title, description, products and placement.
              </p>
            } @else {
              <div style="margin-bottom:1.25rem;"></div>
            }
            @if (designs().length) {
              <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                @for (design of designs(); track design.id) {
                  <app-design-card [design]="design" [ownerEditMode]="isOwner()" />
                }
              </div>
            } @else {
              <div class="pm-empty pm-panel" style="padding:3rem 1.5rem;">
                <p style="font-size:var(--pm-text-sm); color:var(--pm-text-muted);">This designer hasn't published any designs yet.</p>
              </div>
            }
          </section>
        </div>
      </div>
    } @else {
      <div class="pm-container" style="padding:4rem 0;">
        <div class="pm-empty">
          <p>Storefront not found.</p>
          <a routerLink="/marketplace" class="pm-btn pm-btn-secondary pm-btn-sm" style="margin-top:1rem; display:inline-flex;">← Browse marketplace</a>
        </div>
      </div>
    }
  `,
})
export class StorefrontPageComponent {
  private readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly designerId = signal<number>(0);
  readonly designer = computed(() => {
    const u = this.workflow.getUserById(this.designerId());
    return u && u.role === 'designer' ? u : undefined;
  });
  /** The signed-in designer viewing their own storefront → editable cards. */
  readonly isOwner = computed(() => {
    const me = this.auth.user();
    return !!me && me.role === 'designer' && me.id === this.designerId();
  });
  readonly designs = computed(() =>
    this.isOwner()
      ? this.workflow.designsForDesigner(this.designerId()).filter((d) => !d.isUserUpload)
      : this.workflow.storefrontDesigns(this.designerId()),
  );
  readonly totalSales = computed(() => this.designs().reduce((sum, d) => sum + d.sales, 0));
  readonly links = computed(() => this.designer()?.designerProfile?.portfolioLinks ?? []);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.designerId.set(Number(params.get('id') ?? 0));
    });
  }
}
