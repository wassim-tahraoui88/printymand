import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

/** Presentation only: icon + friendlier label for known categories. */
const MOOD_LABELS: Record<string, { label: string; icon: string }> = {
  Culture:    { label: 'Culture',     icon: '🏛️' },
  Typography: { label: 'Calligraphy', icon: '✒️' },
  Minimal:    { label: 'Minimal',     icon: '◻️' },
  Nature:     { label: 'Nature',      icon: '🍃' },
  Streetwear: { label: 'Streetwear',  icon: '👕' },
  Retro:      { label: 'Retro',       icon: '📷' },
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DesignCardComponent, ImageWithFallbackComponent],
  templateUrl: './home.html',
})
export class HomePageComponent {
  private readonly auth     = inject(AuthService);
  private readonly store = inject(PlatformStoreService);

  /**
   * Four designs for the homepage grid. Sourced from the marketplace listing so
   * private customer uploads and designs still awaiting moderation can never
   * surface on the public cover.
   */
  readonly featuredDesigns = computed(() =>
    this.store.marketplaceDesigns().filter((d) => d.status === 'ACTIVE').slice(0, 4),
  );

  /** Three active products for the products preview */
  readonly featuredProducts = computed(() =>
    this.store.products().filter((p) => p.availability === 'ACTIVE').slice(0, 3),
  );

  /**
   * Public-safe headline figures. The admin overview (which includes gross
   * revenue and the full user count) is deliberately NOT exposed here.
   */
  readonly platformOverview = computed(() => this.store.publicStats());

  /** First verified printer for the maker spotlight */
  readonly featuredPrinter = computed(() => this.pressrooms()[0] ?? null);

  /** Verified, still-operating pressrooms for the homepage directory */
  readonly pressrooms = computed(() => this.store.printers().filter((p) => !p.retired));

  readonly primaryLink = computed(() =>
    this.auth.isAuthenticated() ? this.auth.dashboardPath(this.auth.user()!.role) : '/register',
  );
  readonly primaryLabel = computed(() =>
    this.auth.isAuthenticated() ? 'Open workspace' : 'Create your account',
  );

  /**
   * Editorial mood tiles, derived from the live platform category list so a tile
   * can never link to a category that does not exist. (Previously 'Street',
   * 'Abstract' and 'Vintage' were hard-coded and all led to an empty archive.)
   */
  readonly moodCategories = computed(() =>
    this.store.categories().map((category) => ({
      category,
      label: MOOD_LABELS[category]?.label ?? category,
      icon: MOOD_LABELS[category]?.icon ?? '◆',
    })),
  );
}
