import { Injectable, computed, signal } from '@angular/core';

import { RegistrationStage, RegistrationStateVM, UserRole } from './registration.models';

const INITIAL_STATE: RegistrationStateVM = {
  stage: 'ACCOUNT',
  roles: [],
  emailVerified: false,
  phoneVerified: false,
  status: 'PENDING',
};

@Injectable({ providedIn: 'root' })
export class RegistrationStateService {
  private readonly state = signal<RegistrationStateVM>(INITIAL_STATE);

  readonly vm = computed(() => {
    const s = this.state();
    return {
      ...s,
      active: this.isActive(s),
      listable: this.isListable(s),
    };
  });

  setStage(stage: RegistrationStage): void {
    this.state.update((s) => ({ ...s, stage }));
  }

  setRoles(roles: UserRole[]): void {
    this.state.update((s) => ({ ...s, roles }));
  }

  setEmailVerified(value: boolean): void {
    this.state.update((s) => ({ ...s, emailVerified: value }));
  }

  setPhoneVerified(value: boolean): void {
    this.state.update((s) => ({ ...s, phoneVerified: value }));
  }

  setStatus(status: RegistrationStateVM['status']): void {
    this.state.update((s) => ({ ...s, status }));
  }

  setWorkerCategoriesCount(count: number): void {
    const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    this.state.update((s) => ({ ...s, workerCategoriesCount: safe }));
  }

  reset(): void {
    this.state.set(INITIAL_STATE);
  }

  private isActive(s: RegistrationStateVM): boolean {
    return s.stage === 'DONE';
  }

  private isListable(s: RegistrationStateVM): boolean {
    if (!s.roles.includes('WORKER')) return false;
    return s.phoneVerified && (s.workerCategoriesCount ?? 0) >= 1;
  }
}

