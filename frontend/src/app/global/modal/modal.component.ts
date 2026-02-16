import { Component, inject } from '@angular/core';
import { UIContext } from '../../core/ui/ui.context';

@Component({
	selector: 'app-modal',
	templateUrl: './modal.html',
	styleUrl: './modal.css'
})
export class ModalComponent {
	protected _context = inject(UIContext);
	protected modal = this._context.modal;
}