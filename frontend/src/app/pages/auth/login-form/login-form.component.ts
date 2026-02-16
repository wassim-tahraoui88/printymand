import { Component, inject, signal, output, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthContext } from '../../../core/auth/auth.context';
import { finalize } from 'rxjs';

@Component({
	selector: 'auth-login-form',
	standalone: true,
	templateUrl: './login-form.html',
	styleUrl: './login-form.css',
	imports: [ReactiveFormsModule],
})
export class LoginForm implements OnInit {

	private router = inject(Router);
	private _authContext = inject(AuthContext);

	public toggle = output<void>();
	protected loading = signal(false);

	protected activeControl: string | null = null;
	protected form = new FormGroup({
		email: new FormControl('', Validators.required),
		password: new FormControl('', Validators.required),
	});
	protected validationRules: Record<string, { label: string; test: (c: any) => boolean }[]> = {
		email: [ { label: 'Required', test: (c: any) => !(c?.errors?.required) } ],
		password: [ { label: 'Required', test: (c: any) => !(c?.errors?.required) } ]
	};

	ngOnInit() {
		this.form.markAllAsTouched();
	}
	protected onToggle() {
		this.toggle.emit();
		this.form.markAsUntouched();
	}

	protected setActive(name: string) {
		this.activeControl = name;
	}
	protected clearActive() {
		this.activeControl = null;
	}
	protected getChecklist(controlName: string) {
		const control = this.form.get(controlName);
		const rules = this.validationRules[controlName] || [];
		return rules.map(r => ({ label: r.label, valid: r.test(control) }));
	}

	protected onSubmit() : void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.loading.set(true);
		this._authContext.login({ email: this.form.value.email, password: this.form.value.password } as LoginDto)
			.pipe(finalize(() => this.loading.set(false)))
			.subscribe({
				next: async () => {
					// this.toastService.success('Login successful!');
					// this.socketService.connect();
					await this.router.navigate(['/dashboard'])
				},
				error: (err) => {
					// this.toastService.error(err.error?.message ?? 'An unknown error occurred during login.');
				}
			});
	}
}