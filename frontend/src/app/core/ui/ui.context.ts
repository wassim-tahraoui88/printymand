import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UIContext {

	private _toasts = signal<Toast[]>([]);
	private _confirm = signal<ConfirmRequest | null>(null);
	private _modal = signal<ModalOptions | null>(null);

	public readonly toasts = this._toasts.asReadonly();
	public readonly confirm = this._confirm.asReadonly();
	public readonly modal = this._modal.asReadonly();

	public Toasts = {
		info: (message: string, duration?: number) => this.showToast(message, 'info', duration),
		success: (message: string, duration?: number) => this.showToast(message, 'success', duration),
		warning: (message: string, duration?: number) => this.showToast(message, 'warning', duration),
		error: (message: string, duration?: number) => this.showToast(message, 'error', duration),
	}
	public Dialogs = {
		confirm: (title: string, message: string) => this.showConfirmDialog(title, message),
		modal: (title: string, onDismiss?: () => void) => this.showModalDialog(title, onDismiss),
	}

	private showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 4000) {
		const toast : Toast = { id: Date.now() + Math.random(), type, message, duration, dismiss: () => this.dismissToast(toast.id) };
		this._toasts.update(toasts => [...toasts, toast]);
		setTimeout(() => this.dismissToast(toast.id), duration);
	}
	private dismissToast(id: number) {
		this._toasts.update(t => t.filter(x => x.id !== id));
	}

	private showConfirmDialog(title: string, message: string) : Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this._confirm.set({
				title, message,
				resolve: (value: boolean) => {
					resolve(value);
					this._confirm.set(null);
				}
			});
		});
	}

	private showModalDialog(title: string, onDismiss?: () => void) : void {
		this._modal.set({
			title,
			dismiss: () => {
				this._modal.set(null)
				if (onDismiss) onDismiss();
			}
		});
	}
}