import type { Environment } from './environment.model';

/**
 * Development runtime configuration.
 *
 * The app runs on an in-memory/localStorage store (PlatformStoreService) so it
 * is fully functional without a backend. `useRealApi` is read by
 * `PlatformStoreService.tryApi()`: when false no HTTP call is attempted at all,
 * when true every store mutation mirrors itself to the matching ApiService
 * endpoint.
 *
 * `angular.json` swaps this file for `environment.prod.ts` in production builds.
 */
export const environment: Environment = {
  production: false,
  useRealApi: false,
  apiBaseUrl: '/api/v1',
};
