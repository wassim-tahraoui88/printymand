import type { Environment } from './environment.model';

/** Production config — swapped in for environment.ts by angular.json. */
export const environment: Environment = {
  production: true,
  useRealApi: true,
  apiBaseUrl: '/api/v1',
};
