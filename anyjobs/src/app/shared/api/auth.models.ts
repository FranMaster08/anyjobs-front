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
}

export interface VerifyOtpRequest {
  otpCode: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

