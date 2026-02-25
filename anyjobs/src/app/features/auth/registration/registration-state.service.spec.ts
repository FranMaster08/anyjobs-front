import { TestBed } from '@angular/core/testing';

import { RegistrationStateService } from './registration-state.service';

describe('RegistrationStateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('starts at ACCOUNT', () => {
    const service = TestBed.inject(RegistrationStateService);
    expect(service.vm().stage).toBe('ACCOUNT');
  });

  it('marks active when DONE', () => {
    const service = TestBed.inject(RegistrationStateService);
    service.setStage('DONE');
    expect(service.vm().active).toBe(true);
  });

  it('marks listable for WORKER when phone verified + categories >= 1', () => {
    const service = TestBed.inject(RegistrationStateService);
    service.setRoles(['WORKER']);
    service.setPhoneVerified(true);
    service.setWorkerCategoriesCount(1);
    expect(service.vm().listable).toBe(true);
  });

  it('is not listable for WORKER when missing phone verification', () => {
    const service = TestBed.inject(RegistrationStateService);
    service.setRoles(['WORKER']);
    service.setPhoneVerified(false);
    service.setWorkerCategoriesCount(2);
    expect(service.vm().listable).toBe(false);
  });
});

