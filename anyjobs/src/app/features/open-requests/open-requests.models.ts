export interface OpenRequestsListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: 'publishedAtDesc';
}

export interface OpenRequestListItem {
  readonly id: string;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  readonly excerpt: string;
  readonly tags?: readonly string[];
  readonly locationLabel?: string;
  readonly publishedAtLabel?: string;
  readonly budgetLabel?: string;
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
}

export interface OpenRequestsListResponse {
  readonly items: readonly OpenRequestListItem[];
  readonly nextPage: number | null;
  readonly hasMore: boolean;
}

