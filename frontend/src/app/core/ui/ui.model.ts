type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
	id: number;
	type: ToastType;
	message: string;
	duration?: number;
	dismiss: () => void;
}

interface ConfirmRequest {
	title: string;
	message: string;
	resolve: (value: boolean) => void;
}

interface ModalOptions {
	title: string;
	dismiss: () => void;
}