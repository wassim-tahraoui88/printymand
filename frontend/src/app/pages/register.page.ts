import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { RegisterData } from '../models/types';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly model: RegisterData = {
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'customer',
  };
  readonly loading = signal(false);
  readonly error = signal('');

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const result = await this.auth.register(this.model);
    this.loading.set(false);
    if (!result.success) {
      this.error.set(result.error ?? 'Unable to create account.');
      return;
    }
    this.router.navigateByUrl(this.auth.dashboardPath(this.auth.user()!.role));
  }
}
