import { Routes } from '@angular/router';
import { AuthPage } from './pages/auth/auth.page';
import { MainPage } from './pages/main/main.page';
import { authChildGuard } from './core/auth/auth.guard';

export const routes: Routes = [
	{
        path: 'auth',
        component: AuthPage,
    },
	{
        path: '',
        component: MainPage,
        canActivateChild: [authChildGuard],
        children: [
            // Insert child routes here
        ]
    }
];