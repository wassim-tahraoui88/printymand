import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './global/toasts/toasts.component';
import { AuthContext } from './core/auth/auth.context';
import { ConfirmDialogComponent } from './global/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-root',
	imports: [ RouterOutlet, ToastsComponent, ConfirmDialogComponent ],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class AppComponent {

	private auth = inject(AuthContext);
	loading = false;

	constructor() {
		this.auth.refresh().subscribe();
	}
}