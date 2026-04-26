import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { StatCardComponent } from '../components/stat-card.component';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-printer-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardShellComponent, StatCardComponent],
  templateUrl: './printer-dashboard.html',
})
export class PrinterDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly workflow = inject(WorkflowService);

  readonly user = computed(() => this.auth.user());
  readonly products = computed(() => (this.user() ? this.workflow.productsForPrinterUser(this.user()!.id) : []));
  readonly incomingLines = computed(() => (this.user() ? this.workflow.linesForPrinterUser(this.user()!.id) : []));
  readonly totals = computed(() => (this.user() ? this.workflow.printerTotals(this.user()!.id) : { products: 0, revenue: 0, fulfillmentRate: 0, rating: 0 }));
  readonly statusOptions = ['Pending', 'Accepted', 'Printing', 'Shipped', 'Delivered', 'Rejected'] as const;

  updateLineStatus(orderId: number | string, lineId: number, status: 'Pending' | 'Accepted' | 'Printing' | 'Shipped' | 'Delivered' | 'Rejected'): void {
    this.workflow.setOrderLineStatus(orderId, lineId, status);
  }
}
