import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number | string | null;
}

export interface DashboardNavSection {
  title?: string;
  items: DashboardNavItem[];
}

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-sidebar.html',
})
export class DashboardSidebarComponent {
  readonly nav = input.required<DashboardNavSection[]>();
  readonly activeTab = input.required<string>();
  readonly roleLabel = input<string>('Dashboard');
  readonly mobileOpen = input<boolean>(false);

  readonly tabChange = output<string>();
  readonly mobileClose = output<void>();

  readonly collapsed = signal(false);

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  select(id: string): void {
    this.tabChange.emit(id);
    this.mobileClose.emit();
  }
}
