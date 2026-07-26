/**
 * Shape of the runtime environment config.
 *
 * Lives in its own file because `angular.json` swaps `environment.ts` for
 * `environment.prod.ts` in production — if the type lived in `environment.ts`,
 * the prod file would end up importing from itself after the replacement.
 */
export interface Environment {
  production: boolean;
  /** When true, ApiService calls are attempted; when false the local store is authoritative. */
  useRealApi: boolean;
  apiBaseUrl: string;
}
