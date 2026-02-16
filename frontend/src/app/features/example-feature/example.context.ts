import { Injectable, inject, signal } from '@angular/core';
import { ExampleApi } from './example.api';
import { tap } from 'rxjs';

const OPTIMISTIC_UUID = '12345ab-cdef-1234-5678-123456abcdef';

@Injectable({ providedIn: 'root' })
export class ExampleContext {
	private api = inject(ExampleApi);

	private _items = signal<ExampleSummaryDto[]>([]);
	public readonly items = this._items.asReadonly();


	constructor() {}

	public refresh() {
		// Any other refresh logic here
		this.refreshItems();
	}
	public refreshItems() {
		this.api.readAll().subscribe({
			next: items => this._items.set(items),
			error: () => this.clear()
		})
	}

	public setItems(items: ExampleSummaryDto[]): void {
		this._items.set(items);
	}

	public clear() {
		this._items.set([]);
	}

	public readItem(id: string) {
		return this.api.read(id);
	}

	public addItem(item: ExampleCreateDto) {
		const newItem = { ...item, id: OPTIMISTIC_UUID, /* fill required unavailable data with placeholders */ yetAnotherProperty: '123' } as ExampleDto;
		this.applyAddItem(newItem);

		return this.api.create(item).pipe(tap({
			next: (newItem) => {
				this._items.update(items => items.map(item => item.id === OPTIMISTIC_UUID ? newItem : item));
			},
			error: () => {
				this.applyRemoveItem(OPTIMISTIC_UUID);
			}
		}));
	}
	public removeItem(id: string) {
		const items = this._items();
		const initial = [...items];

		this.applyRemoveItem(id);

		return this.api.delete(id).pipe(tap({
			next: () => {
				// no-op: optimistic update was correct
			},
			error: () => {
				this._items.set(initial);
			}
		}));
	}

	public applyAddItem(newItem: ExampleSummaryDto) {
		if (this._items().some(i => i.id === newItem.id)) return;
		this._items.update(items => [...items, newItem]);
	}
	public applyRemoveItem(itemId: string) {
		this._items.update(items => items.filter(i => i.id !== itemId));
	}
}