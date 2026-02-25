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

