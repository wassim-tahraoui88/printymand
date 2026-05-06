import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-designer-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardShellComponent],
  templateUrl: './designer-profile.html',
})
export class DesignerProfilePageComponent {
  readonly auth = inject(AuthService);
  readonly user = computed(() => this.auth.user());
}
