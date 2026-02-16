import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import env from '../../../environments/environment';

const endpoints = {
	register: `${env.apiBaseUrl}/auth/register`,
	login: `${env.apiBaseUrl}/auth/login`,
	logout: `${env.apiBaseUrl}/auth/logout`,
	refresh: `${env.apiBaseUrl}/auth`,
};

@Injectable({
	providedIn: 'root',
})
export class AuthApi {

	private http = inject(HttpClient);

	register(dto: RegisterDto) {
		return this.http.post<UserDto>(endpoints.register, dto, { withCredentials: true });
	}
	login(payload: LoginDto): Observable<UserDto> {
		return this.http.post<UserDto>(endpoints.login, payload, { withCredentials: true });
	}
	logout(): Observable<void> {
		return this.http.post<void>(endpoints.logout, {}, { withCredentials: true });
	}

	refresh(): Observable<UserDto> {
		return this.http.get<UserDto>(endpoints.refresh, { withCredentials: true });
	}
}


