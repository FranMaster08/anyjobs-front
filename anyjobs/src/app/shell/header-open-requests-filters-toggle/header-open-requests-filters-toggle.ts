import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
} from '@angular/core';
import { Subject } from 'rxjs';

import { OpenRequestsFiltersUiService } from '../../features/open-requests/open-requests-filters-ui.service';
import type { OpenRequestsSort } from '../../features/open-requests/open-requests-filter-items';

/** Notifica a la landing que debe recargar el listado (p. ej. cambio de orden). */
export const openRequestsFiltersSortChanged$ = new Subject<void>();

@Component({
  selector: 'app-header-open-requests-filters-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header-open-requests-filters-toggle.html',
  styleUrl: './header-open-requests-filters-toggle.scss',
})
export class HeaderOpenRequestsFiltersToggleComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly filtersUi = inject(OpenRequestsFiltersUiService);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.filtersUi.expanded()) {
        this.filtersUi.close();
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.filtersUi.expanded()) {
      this.filtersUi.close();
    }
  }

  protected togglePanel(): void {
    this.filtersUi.toggle();
  }

  protected closePanel(): void {
    this.filtersUi.close();
  }

  protected clearFilters(): void {
    this.filtersUi.clear();
  }

  protected onQueryInput(event: Event): void {
    this.filtersUi.query.set((event.target as HTMLInputElement).value);
  }

  protected onLocationInput(event: Event): void {
    this.filtersUi.location.set((event.target as HTMLInputElement).value);
  }

  protected onCategoryChange(event: Event): void {
    this.filtersUi.category.set((event.target as HTMLSelectElement).value);
  }

  protected onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value !== 'relevance' && value !== 'publishedAtDesc') return;
    const next = value as OpenRequestsSort;
    if (next === this.filtersUi.sort()) return;
    this.filtersUi.sort.set(next);
    openRequestsFiltersSortChanged$.next();
  }
}
