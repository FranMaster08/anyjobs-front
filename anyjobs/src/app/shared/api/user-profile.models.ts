/** Métricas con fuente real en backend; sin campos inventados. */
export interface UserProfileMetrics {
  openRequestsPublished: number;
  proposalsSent: number;
}

export interface UserPublicProfileDto {
  userId: string;
  fullName: string;
  displayName?: string;
  roles: string[];
  countryCode?: string;
  city?: string;
  municipality?: string;
  area?: string;
  workerHeadline?: string;
  workerBio?: string;
  workerCategories?: string[];
  visibility: 'public';
  metrics: UserProfileMetrics;
}

export interface UserPrivateProfileDto {
  userId: string;
  fullName: string;
  displayName?: string;
  email: string;
  roles: string[];
  status?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  countryCode?: string;
  city?: string;
  municipality?: string;
  area?: string;
  coverageRadiusKm?: number;
  workerHeadline?: string;
  workerBio?: string;
  workerCategories?: string[];
  preferredPaymentMethod?: string;
  documentType?: string;
  documentNumber?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  createdAt?: string;
  visibility: 'private';
  /** Ausente cuando el perfil se arma solo desde la sesión local (API no respondió). */
  metrics?: UserProfileMetrics;
}
