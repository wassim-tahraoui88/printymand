import { EnvironmentProviders, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { httpClientProviders } from './api/http.client';
import { appInitializer } from './app.initializer';

export function provideCore(): EnvironmentProviders {
	return makeEnvironmentProviders([
		...httpClientProviders,
		provideAppInitializer(appInitializer)
	]);
}
