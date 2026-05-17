import type { OpenRequestListItem } from './open-requests.models';

export type OpenRequestsSort = 'relevance' | 'publishedAtDesc';

export interface OpenRequestsListFilters {
  readonly query: string;
  readonly location: string;
  readonly category: string;
  readonly sort: OpenRequestsSort;
}

const CATEGORY_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  hogar: ['hogar', 'limpieza', 'mudanza', 'doméstico', 'domestico'],
  oficio: ['oficio', 'electric', 'plomer', 'pintur', 'carpint', 'gas', 'albañil', 'albanil'],
  servicio: ['servicio', 'consultor', 'asesor'],
};

function normalize(value: string | undefined | null): string {
  return (value ?? '').trim().toLowerCase();
}

function haystack(item: OpenRequestListItem): string {
  const parts = [item.excerpt, item.locationLabel, item.budgetLabel, ...(item.tags ?? [])];
  return parts.map((p) => normalize(p)).filter(Boolean).join(' ');
}

function matchesCategory(item: OpenRequestListItem, category: string): boolean {
  const key = normalize(category);
  if (!key) return true;

  const tags = (item.tags ?? []).map((t) => normalize(t));
  if (tags.some((t) => t === key || t.includes(key))) return true;

  const keywords = CATEGORY_KEYWORDS[key] ?? [key];
  const text = haystack(item);
  return keywords.some((kw) => text.includes(kw));
}

export function applyOpenRequestListFilters(
  items: readonly OpenRequestListItem[],
  filters: OpenRequestsListFilters,
): readonly OpenRequestListItem[] {
  const query = normalize(filters.query);
  const location = normalize(filters.location);

  return items.filter((item) => {
    if (location) {
      const itemLocation = normalize(item.locationLabel);
      if (!itemLocation.includes(location)) return false;
    }

    if (!matchesCategory(item, filters.category)) return false;

    if (query) {
      if (!haystack(item).includes(query)) return false;
    }

    return true;
  });
}

export function hasActiveOpenRequestListFilters(filters: OpenRequestsListFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.location.trim().length > 0 ||
    filters.category.trim().length > 0
  );
}
