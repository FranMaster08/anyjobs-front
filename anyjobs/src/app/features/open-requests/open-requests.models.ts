import type { WorkConditions } from './open-request-work-conditions.constants';
import type { OpenRequestLifecycleStatus } from './open-request-lifecycle-labels';

export type { OpenRequestLifecycleStatus } from './open-request-lifecycle-labels';

export interface OpenRequestsListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: 'publishedAtDesc' | 'date' | 'relevance';
  readonly anonymousId?: string;
}

export interface OpenRequestListItem {
  readonly id: string;
  readonly lifecycleStatus?: OpenRequestLifecycleStatus;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  readonly excerpt: string;
  readonly tags?: readonly string[];
  readonly locationLabel?: string;
  readonly locationLat?: number;
  readonly locationLng?: number;
  readonly publishedAtLabel?: string;
  readonly budgetLabel?: string;
}

export interface NearbyOpenRequestItem extends OpenRequestListItem {
  readonly locationLat: number;
  readonly locationLng: number;
  readonly distanceKm: number;
}

export interface NearbyOpenRequestsResponse {
  readonly items: readonly NearbyOpenRequestItem[];
}

export interface OpenRequestImage {
  readonly url: string;
  readonly alt?: string;
}

export interface OpenRequestProviderReview {
  readonly author: string;
  readonly rating?: number; // 0.0–5.0
  readonly dateLabel?: string;
  readonly text: string;
}

export interface OpenRequestDetail {
  readonly id: string;
  readonly lifecycleStatus?: OpenRequestLifecycleStatus;
  /** UUID del usuario creador; viene del API cuando existe en BD. */
  readonly ownerUserId?: string | null;
  readonly title: string;
  readonly excerpt: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly locationLabel?: string;
  readonly publishedAtLabel?: string;
  readonly budgetLabel?: string;
  readonly provider?: {
    readonly name: string;
    readonly badge?: string;
    readonly subtitle?: string;
  };
  readonly reputation?: number; // 0.0–5.0
  readonly reviewsCount?: number;
  readonly providerReviews?: readonly OpenRequestProviderReview[];
  readonly contactPhone?: string;
  readonly contactEmail?: string;
  readonly images: readonly OpenRequestImage[];
  readonly workConditions?: WorkConditions;
}

export interface OpenRequestsListResponse {
  readonly items: readonly OpenRequestListItem[];
  readonly nextPage: number | null;
  readonly hasMore: boolean;
}

export interface CreateOpenRequestInput {
  readonly title: string;
  readonly excerpt: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly locationLabel: string;
  readonly budgetLabel: string;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  /** Hasta 6 imágenes locales; se envían como partes `files` en multipart. */
  readonly imageFiles?: readonly File[];
  /** JSON de `ImageDto[]` si se envían URLs en payload en lugar de `files`. */
  readonly imagesJson?: string;
  readonly publishedAtLabel?: string;
  readonly workConditions?: WorkConditions;
}

/**
 * Campos opcionales para `PATCH /open-requests/:id` (solo se serializan las propiedades definidas).
 * La pantalla MVP de edición aún no existe; el método de servicio queda para integración futura.
 */
export interface PatchOpenRequestInput {
  readonly title?: string;
  readonly excerpt?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly locationLabel?: string;
  readonly budgetLabel?: string;
  readonly contactPhone?: string;
  readonly contactEmail?: string;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  readonly imageFiles?: readonly File[];
  readonly imagesJson?: string;
  readonly publishedAtLabel?: string;
  readonly workConditions?: WorkConditions;
}
