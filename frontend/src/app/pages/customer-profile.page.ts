import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardShellComponent } from '../components/dashboard-shell.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-customer-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardShellComponent],
  templateUrl: './customer-profile.html',
})
export class CustomerProfilePageComponent {
  private readonly auth = inject(AuthService);
  readonly user = computed(() => this.auth.user());

  update(field: 'name' | 'email' | 'address' | 'avatar', value: string): void {
    this.auth.updateProfile({ [field]: value });
  }

  updateNotes(value: string): void {
    this.auth.updateCustomerProfile({ notes: value });
  }
}
