import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthContext } from '../../core/auth/auth.context';

@Component({
    selector: 'app-main',
    imports: [RouterOutlet, RouterLink],
    templateUrl: './main.html',
    styleUrl: './main.css',
})
export class MainPage {

    protected router = inject(Router);
    protected activatedRoute = inject(ActivatedRoute);
    protected _authContext = inject(AuthContext);

	protected routes = [
		// Insert routes here
	] as { label: string, path: string }[];

	constructor() {

	}


	protected navCollapsed = signal<boolean>(true);
    protected toggleNavBar() {
        this.navCollapsed.update(value => !value);
    }

    protected logout() {
        this._authContext.logout();

    }
}