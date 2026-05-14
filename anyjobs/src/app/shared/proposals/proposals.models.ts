export type ProposalStatus = 'SENT';

export interface Proposal {
  readonly id: string;
  readonly requestId: string;
  readonly userId: string;
  readonly author?: {
    readonly name: string;
    readonly subtitle?: string;
    readonly rating?: number; // 0.0–5.0 (demo)
    readonly reviewsCount?: number;
  };
  readonly whoAmI: string;
  readonly message: string;
  readonly estimate: string;
  readonly createdAt: string; // ISO
  readonly status: ProposalStatus;
}

export interface CreateProposalInput {
  readonly requestId: string;
  /** Solo usado en modo mock/local; el API real toma el usuario de la sesión. */
  readonly userId?: string;
  readonly authorName?: string;
  readonly authorSubtitle?: string;
  readonly whoAmI: string;
  readonly message: string;
  readonly estimate: string;
}

/** Paginación devuelta por `GET /proposals` (`PageMetaDto` en backend). */
export interface ProposalsPageMetaDto {
  readonly totalItems: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly nextPage: number | null;
  readonly previousPage: number | null;
}

/** Cuerpo JSON de listado paginado desde el backend. */
export interface ProposalsListResponseDto {
  readonly items: readonly ProposalApiDto[];
  readonly meta: ProposalsPageMetaDto;
}

/** Autor anidado como lo devuelve la API. */
export interface ProposalAuthorApiDto {
  readonly name: string;
  readonly subtitle: string;
  readonly rating?: number;
  readonly reviewsCount?: number;
}

/** Payload de propuesta tal como lo serializa el backend. */
export interface ProposalApiDto {
  readonly id: string;
  readonly requestId: string;
  readonly userId: string;
  readonly author?: ProposalAuthorApiDto;
  readonly whoAmI: string;
  readonly message: string;
  readonly estimate: string;
  readonly createdAt: string;
  readonly status: ProposalStatus;
}