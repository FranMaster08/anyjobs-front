import { RegistrationStage, RegistrationStatus, UserRole } from '../../features/auth/registration/registration.models';
import { AuthUser } from '../auth/auth.models';

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roles: UserRole[];
}

export interface RegisterResponse {
  status: RegistrationStatus;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
  nextStage: RegistrationStage;
  resumed?: boolean;
}

export interface RegistrationStatusResponse {
  active: boolean;
  status?: RegistrationStatus;
  nextStage?: RegistrationStage;
  roles?: UserRole[];
  emailVerified?: boolean;
  phoneVerified?: boolean;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
}

export interface VerifyOtpRequest {
  otpCode: string;
}

export interface CompleteOnboardingRegistrationRequest {
  account: RegisterRequest;
  emailVerified: boolean;
  phoneVerified: boolean;
  location: {
    city: string;
    municipality: string;
    area: string;
    countryCode: string;
    coverageRadiusKm?: number;
  };
  workerProfile?: {
    categories: string[];
    headline?: string;
    bio?: string;
  };
  preferredPaymentMethod?: 'CARD' | 'TRANSFER' | 'CASH' | 'WALLET';
  personalInfo?: {
    documentType: string;
    documentNumber: string;
    birthDate: string;
    gender: string;
    nationality: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

