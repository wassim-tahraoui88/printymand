import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import env from '../../../environments/environment';

const endpoints = {
	readExampleItem: `${env.apiBaseUrl}/example/:id`,
	readAllExamples: `${env.apiBaseUrl}/example`,
	createExampleItem: `${env.apiBaseUrl}/example`,
	deleteExampleItem: `${env.apiBaseUrl}/example/:id`,
	updateExampleItem: `${env.apiBaseUrl}/example/:id`,
}

@Injectable({ providedIn: 'root' })
export class ExampleApi {
	private http = inject(HttpClient);

	public read(id: string) {
		return this.http.get<ExampleDto>(endpoints.readExampleItem.replace(':id', id), { withCredentials: true });
	}
	public readAll() {
		return this.http.get<ExampleSummaryDto[]>(endpoints.readAllExamples, { withCredentials: true });
	}

	public create(body: ExampleCreateDto) {
		return this.http.post<ExampleSummaryDto>(endpoints.createExampleItem, body, { withCredentials: true });
	}
	public update(id: string, body: any) {
		return this.http.patch<{ /* whatever properties returned by the request */ }>(endpoints.updateExampleItem.replace(':id', id), body, { withCredentials: true });
	}
	public delete(id: string) {
		return this.http.delete<void>(endpoints.deleteExampleItem.replace(':id', id), { withCredentials: true });
	}

}
