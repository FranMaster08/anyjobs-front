export type UserRole = 'CLIENT' | 'WORKER';

export type RegistrationStage =
  | 'ACCOUNT'
  | 'VERIFY'
  | 'LOCATION'
  | 'ROLE_PROFILE'
  | 'PERSONAL_INFO'
  | 'DONE';

export type RegistrationStatus = 'PENDING' | 'ACTIVE';

export interface RegistrationStateVM {
  stage: RegistrationStage;
  roles: UserRole[];
  emailVerified: boolean;
  phoneVerified: boolean;
  status: RegistrationStatus;
  workerCategoriesCount?: number;
}

export type DocumentType = 'DNI' | 'NIE' | 'PASSPORT';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface RegisterFormVM {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  acceptTerms: boolean;
  selectedRoles: UserRole[];
}

export interface LocationFormVM {
  countryCode?: string;
  city: string;
  area?: string;
  coverageRadiusKm?: number;
}

export interface WorkerProfileFormVM {
  categories: string[];
  headline?: string;
  bio?: string;
}

export interface ClientProfileFormVM {
  preferredPaymentMethod?: 'CARD' | 'TRANSFER' | 'CASH' | 'WALLET';
}

export interface PersonalInfoFormVM {
  documentType?: DocumentType;
  documentNumber?: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: Gender;
  nationality?: string;
}

