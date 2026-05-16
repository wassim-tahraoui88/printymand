/**
 * Frontend runtime configuration.
 *
 * The whole app currently runs on an in-memory mock store (PlatformStoreService)
 * so it is fully functional without a backend. When the NestJS backend is ready,
 * flip `useRealApi` to true (or use environment.prod.ts) and implement the
 * matching endpoints in ApiService — every store mutation already has a 1:1
 * ApiService method, so integration is a switch, not a rewrite.
 */
export const environment = {
  production: false,
  /** When true, ApiService responses are trusted; when false, the mock store is authoritative. */
  useRealApi: false,
  apiBaseUrl: '/api/v1',
};
