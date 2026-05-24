import {
  ClientProfileFormVM,
  LocationFormVM,
  PersonalInfoFormVM,
  WorkerProfileFormVM,
} from '../../features/auth/registration/registration.models';

export interface UpdateLocationRequest extends Omit<LocationFormVM, 'coverageRadiusKm'> {
  coverageRadiusKm?: number;
}

export type UpdateWorkerProfileRequest = WorkerProfileFormVM;

export type UpdateClientProfileRequest = ClientProfileFormVM;

export type UpdatePersonalInfoRequest = PersonalInfoFormVM;

export interface UpdateProfileRequest {
  displayName?: string | null;
  countryCode?: string;
  city?: string;
  municipality?: string;
  area?: string;
  coverageRadiusKm?: number;
  workerCategories?: string[];
  headline?: string;
  bio?: string;
  preferredPaymentMethod?: 'CARD' | 'TRANSFER' | 'CASH' | 'WALLET';
}

