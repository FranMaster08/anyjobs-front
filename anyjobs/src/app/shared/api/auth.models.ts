import { RegistrationStage, RegistrationStatus, UserRole } from '../../features/auth/registration/registration.models';

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roles: UserRole[];
}

export interface RegisterResponse {
  userId: string;
  status: RegistrationStatus;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
  nextStage: RegistrationStage;
}

export interface VerifyOtpRequest {
  otpCode: string;
}

