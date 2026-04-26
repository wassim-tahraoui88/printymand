import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DesignCardComponent } from '../components/design-card.component';
import { ProductCardComponent } from '../components/product-card.component';
import { StatCardComponent } from '../components/stat-card.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DesignCardComponent, ProductCardComponent, StatCardComponent],
  templateUrl: './home.html',
})
export class HomePageComponent {
  private readonly auth = inject(AuthService);
  private readonly workflow = inject(WorkflowService);

  readonly featuredDesigns = computed(() => this.workflow.designs().filter((design) => design.status === 'ACTIVE').slice(0, 3));
  readonly featuredProducts = computed(() => this.workflow.products().filter((product) => product.availability === 'ACTIVE').slice(0, 3));
  readonly platformOverview = computed(() => this.workflow.adminOverview());
  readonly primaryLink = computed(() => (this.auth.isAuthenticated() ? this.auth.dashboardPath(this.auth.user()!.role) : '/register'));
  readonly primaryLabel = computed(() => (this.auth.isAuthenticated() ? 'Open workspace' : 'Create your account'));
}
