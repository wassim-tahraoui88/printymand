import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi } from './auth.api';
import { finalize, tap } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class AuthContext {

	private api = inject(AuthApi);
	private router = inject(Router);

	private _user = signal<UserDto | null>(null);
	public readonly user = this._user.asReadonly();
	public readonly isAuthenticated = computed(() => this._user() !== null);

	private _loading = signal(false);
	public readonly loading = this._loading.asReadonly();

	constructor() {
		effect(() => {
			if (this.isAuthenticated()) this.router.navigate(['/dashboard']);
			else this.router.navigate(['/auth']);
		});
	}

	register(dto: RegisterDto) {
		this._loading.set(true);

		return this.api.register(dto).pipe(
			tap({ next: user => this._user.set(user), error: () => this._user.set(null) }),
			finalize(() => this._loading.set(false))
		);
	}
	login(dto: LoginDto) {
		this._loading.set(true);

		return this.api.login(dto).pipe(
			tap({ next: user => this._user.set(user), error: () => this._user.set(null) }),
			finalize(() => this._loading.set(false))
		);
	}
	logout() {
		this.api.logout().subscribe({
			next: () => this._user.set(null),
			error: () => this._user.set(null)
		});
	}

	refresh() {
		this._loading.set(true);
		return this.api.refresh().pipe(
			tap({ next: user => this._user.set(user), error: () => this._user.set(null) }),
			finalize(() => this._loading.set(false))
		);
	}
}


