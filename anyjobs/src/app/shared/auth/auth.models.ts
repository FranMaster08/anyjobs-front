import { DocumentType, Gender, RegistrationStatus, UserRole } from '../../features/auth/registration/registration.models';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  roles: UserRole[];

  // Contact & verification (MVP)
  phoneNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  status?: RegistrationStatus;

  // Location (MVP)
  countryCode?: string;
  city?: string;
  area?: string;
  coverageRadiusKm?: number;

  // Role profile (MVP)
  workerCategories?: string[];
  workerHeadline?: string;
  workerBio?: string;
  preferredPaymentMethod?: 'CARD' | 'TRANSFER' | 'CASH' | 'WALLET';

  // Personal info (MVP)
  documentType?: DocumentType;
  documentNumber?: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: Gender;
  nationality?: string;

  createdAt?: string; // ISO
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

