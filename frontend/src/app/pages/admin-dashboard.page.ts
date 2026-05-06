import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { StatCardComponent } from '../components/stat-card.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardShellComponent, StatCardComponent],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);

  readonly search = signal('');
  readonly overview = computed(() => this.workflow.adminOverview());
  readonly users = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.auth.users().filter((user) => {
      if (!query) return true;
      return [user.name, user.email, user.role].some((value) => value.toLowerCase().includes(query));
    });
  });
  readonly designs = computed(() => this.workflow.designs());
}
