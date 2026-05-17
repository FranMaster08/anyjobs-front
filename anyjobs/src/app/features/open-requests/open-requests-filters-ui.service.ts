import { computed, Injectable, signal } from '@angular/core';

import {
  hasActiveOpenRequestListFilters,
  type OpenRequestsListFilters,
  type OpenRequestsSort,
} from './open-requests-filter-items';

@Injectable({ providedIn: 'root' })
export class OpenRequestsFiltersUiService {
  readonly expanded = signal(false);
  readonly query = signal('');
  readonly location = signal('');
  readonly category = signal('');
  readonly sort = signal<OpenRequestsSort>('relevance');

  readonly filters = computed<OpenRequestsListFilters>(() => ({
    query: this.query(),
    location: this.location(),
    category: this.category(),
    sort: this.sort(),
  }));

  readonly hasActiveFilters = computed(() => hasActiveOpenRequestListFilters(this.filters()));

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  close(): void {
    this.expanded.set(false);
  }

  clear(): void {
    this.query.set('');
    this.location.set('');
    this.category.set('');
  }
}
