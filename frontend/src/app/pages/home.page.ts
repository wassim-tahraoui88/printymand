import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { ImageWithFallbackComponent } from '../components/image-with-fallback.component';
import { ProductCardComponent } from '../components/product-card.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DesignCardComponent, ProductCardComponent, ImageWithFallbackComponent],
  templateUrl: './home.html',
})
export class HomePageComponent {
  private readonly auth     = inject(AuthService);
  private readonly workflow = inject(WorkflowService);

  /** Four active designs for the homepage grid */
  readonly featuredDesigns = computed(() =>
    this.workflow.designs().filter((d) => d.status === 'ACTIVE').slice(0, 4),
  );

  /** Three active products for the products preview */
  readonly featuredProducts = computed(() =>
    this.workflow.products().filter((p) => p.availability === 'ACTIVE').slice(0, 3),
  );

  readonly platformOverview = computed(() => this.workflow.adminOverview());

  /** First verified printer for the maker spotlight */
  readonly featuredPrinter = computed(() => this.workflow.printers()[0] ?? null);

  /** All verified pressrooms for the homepage directory */
  readonly pressrooms = computed(() => this.workflow.printers());

  readonly primaryLink = computed(() =>
    this.auth.isAuthenticated() ? this.auth.dashboardPath(this.auth.user()!.role) : '/register',
  );
  readonly primaryLabel = computed(() =>
    this.auth.isAuthenticated() ? 'Open workspace' : 'Create your account',
  );

  /** Editorial mood tiles → map to real design categories */
  readonly moodCategories = [
    { label: 'Streetwear', icon: '👕', category: 'Street'     },
    { label: 'Calligraphy',icon: '✒️', category: 'Typography' },
    { label: 'Minimal',    icon: '◻️', category: 'Minimal'    },
    { label: 'Abstract',   icon: '🎨', category: 'Abstract'   },
    { label: 'Vintage',    icon: '📷', category: 'Vintage'    },
    { label: 'Nature',     icon: '🍃', category: 'Nature'     },
  ] as const;
}
