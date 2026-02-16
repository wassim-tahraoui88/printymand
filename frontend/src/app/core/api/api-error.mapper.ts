export type ApiErrorType = | 'Unauthorized' | 'Forbidden' | 'NotFound' | 'Validation' | 'Conflict' | 'Server' | 'Network' | 'Unknown';

export interface ApiError {
	type: ApiErrorType;
	message?: string;
	details?: unknown;
}

export function mapHttpError(error: unknown): ApiError {
	if (!(error as any)?.status) return { type: 'Network' };
	switch ((error as any).status) {
		case 401:
			return { type: 'Unauthorized' };
		case 403:
			return { type: 'Forbidden' };
		case 404:
			return { type: 'NotFound' };
		case 409:
			return { type: 'Conflict' };
		case 422:
			return { type: 'Validation', details: (error as any).error };
		case 500:
			return { type: 'Server' };
		default:
			return { type: 'Unknown' };
	}
}
