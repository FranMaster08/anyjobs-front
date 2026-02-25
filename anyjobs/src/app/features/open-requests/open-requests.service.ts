import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  OpenRequestDetail,
  OpenRequestImage,
  OpenRequestListItem,
  OpenRequestProviderReview,
  OpenRequestsListParams,
  OpenRequestsListResponse,
} from './open-requests.models';

export const OPEN_REQUESTS_API_URL = new InjectionToken<string>('OPEN_REQUESTS_API_URL', {
  providedIn: 'root',
  // Por ahora usamos mock local (assets) hasta definir el endpoint real.
  factory: () => '/mock/open-requests.mock.json',
});

interface OpenRequestsListResponseDto {
  items?: OpenRequestListItemDto[];
  nextPage?: number | null;
  hasMore?: boolean;
}

interface MockOpenRequestsApi {
  pages: Record<string, OpenRequestsListResponseDto>;
  details?: Record<string, OpenRequestDetailDto>;
}

interface OpenRequestListItemDto {
  id: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  excerpt?: string | null;
  tags?: string[] | null;
  locationLabel?: string | null;
  publishedAtLabel?: string | null;
  budgetLabel?: string | null;
}

interface OpenRequestImageDto {
  url: string;
  alt?: string | null;
}

interface OpenRequestDetailDto {
  id: string;
  title?: string | null;
  excerpt?: string | null;
  description?: string | null;
  tags?: string[] | null;
  locationLabel?: string | null;
  publishedAtLabel?: string | null;
  budgetLabel?: string | null;
  providerName?: string | null;
  providerBadge?: string | null;
  providerSubtitle?: string | null;
  reputation?: number | null;
  reviewsCount?: number | null;
  providerReviews?: OpenRequestProviderReviewDto[] | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  images?: OpenRequestImageDto[] | null;
}

interface OpenRequestProviderReviewDto {
  author?: string | null;
  rating?: number | null;
  dateLabel?: string | null;
  text?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OpenRequestsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(OPEN_REQUESTS_API_URL);

  listOpenRequests(params: OpenRequestsListParams): Observable<OpenRequestsListResponse> {
    const page = Math.max(1, params.page);
    const pageSize = Math.max(1, params.pageSize);

    // Soporta mock local con paginado simulado: { pages: { "1": {...}, "2": {...} } }
    if (this.apiUrl.includes('/mock/')) {
      return this.http.get<MockOpenRequestsApi>(this.apiUrl).pipe(
        map((mock) => mock.pages[String(page)] ?? { items: [], nextPage: null, hasMore: false }),
        map((dto) => toListResponse(dto, pageSize)),
      );
    }

    let httpParams = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<OpenRequestsListResponseDto>(this.apiUrl, { params: httpParams }).pipe(
      map((dto) => toListResponse(dto, pageSize)),
    );
  }

  getOpenRequestDetail(id: string): Observable<OpenRequestDetail> {
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
      return this.http.get<MockOpenRequestsApi>(this.apiUrl).pipe(map(() => missingDetail('')));
    }

    if (this.apiUrl.includes('/mock/')) {
      return this.http.get<MockOpenRequestsApi>(this.apiUrl).pipe(map((mock) => toDetailResponse(mock, trimmedId)));
    }

    // Placeholder para endpoint real futuro.
    return this.http.get<OpenRequestDetailDto>(`${this.apiUrl}/${encodeURIComponent(trimmedId)}`).pipe(
      map((dto) => normalizeDetail(dto, null)),
    );
  }
}

function toListResponse(dto: OpenRequestsListResponseDto, pageSize: number): OpenRequestsListResponse {
  const nextPage = dto.nextPage ?? null;
  const hasMore = dto.hasMore ?? nextPage !== null;

  const items = (dto.items ?? []).slice(0, pageSize).map(normalizeListItem);

  return { items, nextPage, hasMore };
}

function normalizeListItem(dto: OpenRequestListItemDto): OpenRequestListItem {
  const excerpt = (dto.excerpt ?? '').trim();
  const imageUrl = (dto.imageUrl ?? '').trim();
  const imageAlt = (dto.imageAlt ?? '').trim();

  return {
    id: dto.id,
    excerpt: excerpt.length > 0 ? excerpt : 'Sin descripción',
    imageUrl: imageUrl.length > 0 ? imageUrl : undefined,
    imageAlt: imageAlt.length > 0 ? imageAlt : undefined,
    tags: dto.tags ?? undefined,
    locationLabel: dto.locationLabel ?? undefined,
    publishedAtLabel: dto.publishedAtLabel ?? undefined,
    budgetLabel: dto.budgetLabel ?? undefined,
  };
}

function toDetailResponse(mock: MockOpenRequestsApi, id: string): OpenRequestDetail {
  const dto = mock.details?.[id] ?? null;

  const allItems: OpenRequestListItemDto[] = [];
  for (const page of Object.values(mock.pages ?? {})) {
    for (const item of page.items ?? []) allItems.push(item);
  }
  const base = allItems.find((x) => x.id === id) ?? null;

  if (!dto && !base) return missingDetail(id);

  return normalizeDetail(dto ?? { id }, base);
}

function normalizeDetail(dto: OpenRequestDetailDto, base: OpenRequestListItemDto | null): OpenRequestDetail {
  const title = (dto.title ?? '').trim();
  const excerpt = (dto.excerpt ?? base?.excerpt ?? '').trim();
  const description = (dto.description ?? '').trim();

  const rawImages = dto.images ?? [];
  const images: OpenRequestImage[] =
    rawImages.length > 0
      ? rawImages.map((img) => normalizeImage(img)).filter((x): x is OpenRequestImage => x !== null)
      : normalizeFallbackImages(base);

  const providerName = (dto.providerName ?? '').trim();
  const providerBadge = (dto.providerBadge ?? '').trim();
  const providerSubtitle = (dto.providerSubtitle ?? '').trim();

  const rawReputation = dto.reputation ?? null;
  const reputation =
    typeof rawReputation === 'number' && Number.isFinite(rawReputation)
      ? Math.min(5, Math.max(0, rawReputation))
      : undefined;

  const rawReviews = dto.reviewsCount ?? null;
  const reviewsCount =
    typeof rawReviews === 'number' && Number.isFinite(rawReviews) && rawReviews >= 0
      ? Math.floor(rawReviews)
      : undefined;

  const providerReviews: OpenRequestProviderReview[] | undefined = normalizeProviderReviews(dto.providerReviews ?? null);

  return {
    id: dto.id,
    title: title.length > 0 ? title : `Solicitud ${dto.id}`,
    excerpt: excerpt.length > 0 ? excerpt : 'Sin descripción',
    description: description.length > 0 ? description : undefined,
    tags: dto.tags ?? base?.tags ?? undefined,
    locationLabel: dto.locationLabel ?? base?.locationLabel ?? undefined,
    publishedAtLabel: dto.publishedAtLabel ?? base?.publishedAtLabel ?? undefined,
    budgetLabel: dto.budgetLabel ?? base?.budgetLabel ?? undefined,
    provider:
      providerName.length > 0
        ? {
            name: providerName,
            badge: providerBadge.length > 0 ? providerBadge : undefined,
            subtitle: providerSubtitle.length > 0 ? providerSubtitle : undefined,
          }
        : undefined,
    reputation,
    reviewsCount,
    providerReviews,
    contactPhone: (dto.contactPhone ?? '').trim() || undefined,
    contactEmail: (dto.contactEmail ?? '').trim() || undefined,
    images,
  };
}

function normalizeProviderReviews(raw: OpenRequestProviderReviewDto[] | null): OpenRequestProviderReview[] | undefined {
  if (!raw || raw.length === 0) return undefined;

  const items = raw
    .map((r) => {
      const author = (r.author ?? '').trim();
      const text = (r.text ?? '').trim();
      if (author.length === 0 || text.length === 0) return null;

      const dateLabel = (r.dateLabel ?? '').trim();

      const rawRating = r.rating ?? null;
      const rating =
        typeof rawRating === 'number' && Number.isFinite(rawRating)
          ? Math.min(5, Math.max(0, rawRating))
          : undefined;

      const out: OpenRequestProviderReview = {
        author,
        text,
        ...(dateLabel.length > 0 ? { dateLabel } : {}),
        ...(rating !== undefined ? { rating } : {}),
      };

      return out;
    })
    .filter((x): x is OpenRequestProviderReview => x !== null);

  return items.length > 0 ? items : undefined;
}

function normalizeImage(dto: OpenRequestImageDto): OpenRequestImage | null {
  const url = (dto.url ?? '').trim();
  if (url.length === 0) return null;
  const alt = (dto.alt ?? '').trim();
  return { url, alt: alt.length > 0 ? alt : undefined };
}

function normalizeFallbackImages(base: OpenRequestListItemDto | null): OpenRequestImage[] {
  const url = (base?.imageUrl ?? '').trim();
  if (url.length === 0) return [];
  const alt = (base?.imageAlt ?? '').trim();
  return [{ url, alt: alt.length > 0 ? alt : undefined }];
}

function missingDetail(id: string): OpenRequestDetail {
  return {
    id,
    title: id ? `Solicitud ${id}` : 'Solicitud',
    excerpt: 'Sin descripción',
    images: [],
  };
}

