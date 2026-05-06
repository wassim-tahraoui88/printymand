import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardShellComponent],
  templateUrl: './admin-profile.html',
})
export class AdminProfilePageComponent {
  readonly auth = inject(AuthService);
  readonly user = computed(() => this.auth.user());
}
