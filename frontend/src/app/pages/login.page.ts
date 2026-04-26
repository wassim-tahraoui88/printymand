import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);
  readonly demoAccounts = this.auth.demoAccounts;

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const result = await this.auth.login(this.email, this.password);
    this.loading.set(false);
    if (!result.success) {
      this.error.set(result.error ?? 'Unable to sign in.');
      return;
    }
    this.router.navigateByUrl(this.auth.dashboardPath(this.auth.user()!.role));
  }

  useDemo(email: string, password: string): void {
    this.email = email;
    this.password = password;
  }
}
