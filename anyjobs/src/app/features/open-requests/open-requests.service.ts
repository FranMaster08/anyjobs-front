import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';

import { buildOpenRequestCreateFormData, buildOpenRequestPatchFormData } from './open-requests-multipart';
import {
  CreateOpenRequestInput,
  OpenRequestDetail,
  OpenRequestImage,
  OpenRequestListItem,
  OpenRequestProviderReview,
  NearbyOpenRequestItem,
  NearbyOpenRequestsResponse,
  OpenRequestsListParams,
  OpenRequestsListResponse,
  PatchOpenRequestInput,
} from './open-requests.models';
import type { WorkConditions } from './open-request-work-conditions.constants';
import { normalizeLifecycleStatus } from './open-request-lifecycle-labels';

export const OPEN_REQUESTS_API_URL = new InjectionToken<string>('OPEN_REQUESTS_API_URL', {
  providedIn: 'root',
  // Por defecto apunta al backend (vía same-origin / proxy en dev).
  factory: () => {
    const doc = inject(DOCUMENT);
    return new URL('/open-requests', doc.baseURI).toString();
  },
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
  lifecycleStatus?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  excerpt?: string | null;
  tags?: string[] | null;
  locationLabel?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  publishedAtLabel?: string | null;
  budgetLabel?: string | null;
}

interface NearbyOpenRequestListItemDto extends OpenRequestListItemDto {
  locationLat: number;
  locationLng: number;
  distanceKm: number;
}

interface NearbyOpenRequestsResponseDto {
  items?: NearbyOpenRequestListItemDto[];
}

interface OpenRequestImageDto {
  url: string;
  alt?: string | null;
}

interface OpenRequestDetailDto {
  id: string;
  lifecycleStatus?: string | null;
  ownerUserId?: string | null;
  title?: string | null;
  excerpt?: string | null;
  description?: string | null;
  tags?: string[] | null;
  locationLabel?: string | null;
  publishedAtLabel?: string | null;
  budgetLabel?: string | null;
  // Compat (mock legacy)
  providerName?: string | null;
  providerBadge?: string | null;
  providerSubtitle?: string | null;
  // Backend real
  provider?: { name: string; badge?: string | null; subtitle?: string | null } | null;
  reputation?: number | null;
  reviewsCount?: number | null;
  providerReviews?: OpenRequestProviderReviewDto[] | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  images?: OpenRequestImageDto[] | null;
  workConditions?: WorkConditions | null;
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
    if (params.anonymousId) httpParams = httpParams.set('anonymousId', params.anonymousId);

    return this.http.get<OpenRequestsListResponseDto>(this.apiUrl, { params: httpParams }).pipe(
      map((dto) => toListResponse(dto, pageSize)),
    );
  }

  listNearbyOpenRequests(
    lat: number,
    lng: number,
    options?: { limit?: number; radiusKm?: number },
  ): Observable<NearbyOpenRequestsResponse> {
    if (this.apiUrl.includes('/mock/')) {
      return throwError(() => new Error('listNearbyOpenRequests no está disponible en modo mock'));
    }

    let params = new HttpParams().set('lat', lat).set('lng', lng);
    if (options?.limit != null) params = params.set('limit', options.limit);
    if (options?.radiusKm != null) params = params.set('radiusKm', options.radiusKm);

    return this.http
      .get<NearbyOpenRequestsResponseDto>(`${this.apiUrl}/nearby`, { params })
      .pipe(map((dto) => ({ items: (dto.items ?? []).map(normalizeNearbyItem) })));
  }

  createOpenRequest(input: CreateOpenRequestInput): Observable<OpenRequestDetail> {
    if (this.apiUrl.includes('/mock/')) {
      return throwError(() => new Error('createOpenRequest no está disponible en modo mock'));
    }

    const body = buildOpenRequestCreateFormData(input);

    return this.http
      .post<OpenRequestDetailDto>(this.apiUrl, body)
      .pipe(map((dto) => normalizeDetail(dto, null)));
  }

  /**
   * Actualiza una solicitud existente (`PATCH /open-requests/:id`, multipart).
   * Requiere permiso `open-requests.update` y Bearer (interceptor).
   */
  patchOpenRequest(id: string, patch: PatchOpenRequestInput): Observable<OpenRequestDetail> {
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
      return throwError(() => new Error('patchOpenRequest: id vacío'));
    }
    if (this.apiUrl.includes('/mock/')) {
      return throwError(() => new Error('patchOpenRequest no está disponible en modo mock'));
    }

    const url = `${this.apiUrl}/${encodeURIComponent(trimmedId)}`;
    const body = buildOpenRequestPatchFormData(patch);

    return this.http
      .patch<OpenRequestDetailDto>(url, body)
      .pipe(map((dto) => normalizeDetail(dto, null)));
  }

  listMyOpenRequests(params: OpenRequestsListParams): Observable<OpenRequestsListResponse> {
    const page = Math.max(1, params.page);
    const pageSize = Math.max(1, params.pageSize);

    if (this.apiUrl.includes('/mock/')) {
      return throwError(() => new Error('listMyOpenRequests no está disponible en modo mock'));
    }

    const httpParams = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http
      .get<OpenRequestsListResponseDto>(`${this.apiUrl}/mine`, { params: httpParams })
      .pipe(map((dto) => toListResponse(dto, pageSize)));
  }

  cancelOpenRequest(id: string): Observable<OpenRequestDetail> {
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
      return throwError(() => new Error('Identificador de solicitud inválido'));
    }
    if (this.apiUrl.includes('/mock/')) {
      return throwError(() => new Error('cancelOpenRequest no está disponible en modo mock'));
    }

    return this.http
      .post<OpenRequestDetailDto>(`${this.apiUrl}/${encodeURIComponent(trimmedId)}/cancel`, {})
      .pipe(map((dto) => normalizeDetail(dto, null)));
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
    lifecycleStatus: normalizeLifecycleStatus(dto.lifecycleStatus ?? undefined),
    excerpt: excerpt.length > 0 ? excerpt : 'Sin descripción',
    imageUrl: imageUrl.length > 0 ? imageUrl : undefined,
    imageAlt: imageAlt.length > 0 ? imageAlt : undefined,
    tags: dto.tags ?? undefined,
    locationLabel: dto.locationLabel ?? undefined,
    ...(dto.locationLat != null && dto.locationLng != null
      ? { locationLat: dto.locationLat, locationLng: dto.locationLng }
      : {}),
    publishedAtLabel: dto.publishedAtLabel ?? undefined,
    budgetLabel: dto.budgetLabel ?? undefined,
  };
}

function normalizeNearbyItem(dto: NearbyOpenRequestListItemDto): NearbyOpenRequestItem {
  const base = normalizeListItem(dto);
  return {
    ...base,
    locationLat: dto.locationLat,
    locationLng: dto.locationLng,
    distanceKm: dto.distanceKm,
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

  const providerFromObj = dto.provider && typeof dto.provider === 'object' ? dto.provider : null;
  const providerName = (providerFromObj?.name ?? dto.providerName ?? '').trim();
  const providerBadge = (providerFromObj?.badge ?? dto.providerBadge ?? '').trim();
  const providerSubtitle = (providerFromObj?.subtitle ?? dto.providerSubtitle ?? '').trim();

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

  const workConditions = normalizeWorkConditions(dto.workConditions);

  return {
    id: dto.id,
    lifecycleStatus: normalizeLifecycleStatus(dto.lifecycleStatus ?? undefined),
    ...(typeof dto.ownerUserId === 'string' && dto.ownerUserId.trim().length > 0
      ? { ownerUserId: dto.ownerUserId.trim() }
      : dto.ownerUserId === null
        ? { ownerUserId: null as null }
        : {}),
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
    ...(workConditions ? { workConditions } : {}),
  };
}

function normalizeWorkConditions(raw: WorkConditions | null | undefined): WorkConditions | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: WorkConditions = {};
  const keys: (keyof WorkConditions)[] = [
    'ownToolsRequired',
    'workerMustTravel',
    'requesterProvidesMaterials',
    'requesterProvidesTools',
    'priorExperienceRequired',
    'scheduleFlexible',
    'priorVisitRequired',
    'easyAccessOrInstructions',
    'additionalInstructions',
  ];
  for (const key of keys) {
    const value = raw[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) (out as Record<string, string>)[key] = trimmed;
  }
  return Object.keys(out).length > 0 ? out : undefined;
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
    ownerUserId: undefined,
    title: id ? `Solicitud ${id}` : 'Solicitud',
    excerpt: 'Sin descripción',
    images: [],
  };
}

