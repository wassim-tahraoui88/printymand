import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideCore } from './core/core.providers';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
	    provideCore(),
        provideRouter(routes),
        provideCharts(withDefaultRegisterables()),
    ]
};