import { Injectable } from '@angular/core';

import {
  RegistrationStage,
  RegistrationStateVM,
  UserRole,
} from './registration.models';

const STORAGE_KEY = 'aj_registration_draft_v1';

export interface RegistrationAccountDraft {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roles: UserRole[];
}

export interface RegistrationLocationDraft {
  countryCode: string;
  city: string;
  municipality: string;
  area: string;
  coverageRadiusKm: number | null;
}

export interface RegistrationWorkerProfileDraft {
  categories: string[];
  headline: string;
  bio: string;
}

export interface RegistrationClientProfileDraft {
  preferredPaymentMethod: string;
}

export interface RegistrationPersonalDraft {
  documentType: string;
  documentNumber: string;
  birthDate: string;
  gender: string;
  nationality: string;
}

export interface RegistrationDraft {
  stage: RegistrationStage;
  status: RegistrationStateVM['status'];
  emailVerified: boolean;
  phoneVerified: boolean;
  account?: RegistrationAccountDraft;
  location?: RegistrationLocationDraft;
  workerProfile?: RegistrationWorkerProfileDraft;
  clientProfile?: RegistrationClientProfileDraft;
  personal?: RegistrationPersonalDraft;
}

@Injectable({ providedIn: 'root' })
export class RegistrationDraftService {
  load(): RegistrationDraft | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as RegistrationDraft;
    } catch {
      return null;
    }
  }

  save(draft: RegistrationDraft): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }

  clear(): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
