import { Component, inject } from '@angular/core';
import { UIContext } from '../../core/ui/ui.context';

@Component({
	selector: 'app-toast-container',
	templateUrl: './toasts.html',
	styleUrl: './toasts.css'
})
export class ToastsComponent {
	private _context = inject(UIContext);
	protected toasts = this._context.toasts;
}