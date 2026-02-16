import { Component, signal } from '@angular/core';
import { LoginForm } from './login-form/login-form.component';
import { RegisterForm } from './register-form/register-form.component';

@Component({
	selector: 'app-auth',
	templateUrl: './auth.html',
	styleUrl: './auth.css',
	imports: [LoginForm, RegisterForm]
})
export class AuthPage {

	protected isLogin = signal(true);

	protected toggleForm(state: boolean): void {
		this.isLogin.set(state);
	}

}