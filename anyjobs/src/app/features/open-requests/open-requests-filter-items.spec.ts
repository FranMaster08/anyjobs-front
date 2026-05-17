import { describe, expect, it } from 'vitest';

import { applyOpenRequestListFilters } from './open-requests-filter-items';
import type { OpenRequestListItem } from './open-requests.models';

const items: readonly OpenRequestListItem[] = [
  {
    id: '1',
    excerpt: 'Electricista para reforma',
    locationLabel: 'Madrid Centro',
    tags: ['oficio', 'electricidad'],
  },
  {
    id: '2',
    excerpt: 'Limpieza de hogar semanal',
    locationLabel: 'Barcelona',
    tags: ['hogar'],
  },
];

describe('applyOpenRequestListFilters', () => {
  it('filtra por texto, ubicación y categoría', () => {
    const result = applyOpenRequestListFilters(items, {
      query: 'limpieza',
      location: 'barcelona',
      category: 'hogar',
      sort: 'relevance',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('2');
  });

  it('devuelve todo sin filtros activos', () => {
    const result = applyOpenRequestListFilters(items, {
      query: '',
      location: '',
      category: '',
      sort: 'relevance',
    });
    expect(result).toHaveLength(2);
  });
});
