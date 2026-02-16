import { Component, inject, signal, output, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { AuthContext } from '../../../core/auth/auth.context';
import { finalize } from 'rxjs';

@Component({
	selector: 'auth-register-form',
	templateUrl: './register-form.html',
	styleUrl: './register-form.css',
	imports: [ReactiveFormsModule]
})
export class RegisterForm implements OnInit {

	private _authContext = inject(AuthContext);

	public toggle = output<void>();
	protected loading = signal(false);

	protected activeControl: string | null = null;
	protected form = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(48), Validators.pattern(/^[a-zA-Z\s'-]+$/)]),
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required, Validators.minLength(8)]),
		confirmPassword: new FormControl('', [Validators.required, (control): ValidationErrors | null => {
			if (this.form) return control.value === this.form.get('password')?.value ? null : { mismatch: true };
			return null;
		}]),
	});
	protected validationRules: Record<string, { label: string; test: (c: any) => boolean }[]> = {
		name: [
			{ label: 'Required', test: (c: any) => !(c?.errors?.required) },
			{ label: 'Between 4 and 48 characters', test: (c: any) => !(c?.errors?.minlength) && !(c?.errors?.maxlength) && (c?.value?.length ?? 0) >= 4 && (c?.value?.length ?? 0) <= 48 },
			{ label: 'Valid Characters (letters, spaces, \', \'-\')', test: (c: any) => (c?.value?.length ?? 0) > 0 && !(c?.errors?.pattern) },
		],
		email: [
			{ label: 'Required', test: (c: any) => !(c?.errors?.required) },
			{ label: 'Between 6 and 24 characters', test: (c: any) => !(c?.errors?.minlength) && !(c?.errors?.maxlength) && (c?.value?.length ?? 0) >= 6 && (c?.value?.length ?? 0) <= 24 },
			{ label: 'Valid Characters (alphanumeric, ., _)', test: (c: any) => (c?.value?.length ?? 0) > 0 && !(c?.errors?.pattern) },
		],
		password: [
			{ label: 'Required', test: (c: any) => !(c?.errors?.required) },
			{ label: 'At least 8 characters', test: (c: any) => !(c?.errors?.minlength) && (c?.value?.length ?? 0) >= 8 },
		],
		confirmPassword: [
			{ label: 'Required', test: (c: any) => !(c?.errors?.required) },
			{ label: 'Matches password', test: (c: any) => (c?.value?.length ?? 0) > 0 && !(c?.errors?.mismatch) },
		]
	};

	ngOnInit() {
		this.form.markAsUntouched();
    }

	public onToggle() {
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
		this._authContext.register({
			name: this.form.value.name,
			email: this.form.value.email,
			password: this.form.value.password,
			// TODO: Add address and role
		} as RegisterDto)
			.pipe(finalize(() => this.loading.set(false)))
			.subscribe({
				next: () => {
					// this.toastService.success('Registration successful! You can now log in.');
				},
				error: (err) => {
					// this.toastService.error(err?.error?.message || 'Registration failed. Please try again.');
					console.log(err);
				}
			});
	}
}