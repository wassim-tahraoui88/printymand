import { Component, inject } from '@angular/core';
import { UIContext } from '../../core/ui/ui.context';

@Component({
	selector: 'app-confirm-dialog',
	templateUrl: './confirm-dialog.html',
	styleUrl: './confirm-dialog.css'
})
export class ConfirmDialogComponent {
	protected _context = inject(UIContext);
	protected confirm = this._context.confirm;
}