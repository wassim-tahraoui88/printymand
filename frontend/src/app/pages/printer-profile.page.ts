import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-printer-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardShellComponent],
  templateUrl: './printer-profile.html',
})
export class PrinterProfilePageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);
  readonly user = computed(() => this.auth.user());

  /** Global products this printer has opted into (managed in the dashboard). */
  readonly products = computed(() => (this.user() ? this.workflow.productsForPrinterUser(this.user()!.id) : []));
}
