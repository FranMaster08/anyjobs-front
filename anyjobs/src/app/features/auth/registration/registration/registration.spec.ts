import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Registration } from './registration';
import { RegistrationStateService } from '../registration-state.service';
import { AuthApi } from '../../../../shared/api/auth.api';
import { buildLocationCatalogResponse } from '../../../../shared/location/location-geography.data';

/** Expone en tests la API `protected` del componente sin usar `any`. */
interface RegistrationTestHarness {
  readonly accountForm: FormGroup;
  readonly verifyForm: FormGroup;
  readonly locationForm: FormGroup;
  readonly personalForm: FormGroup;
  onAccountContinue(): void;
  onVerifyContinue(): void;
  onLocationContinue(): void;
  onPersonalContinue(): void;
  finish(): void;
  verifyEmail(): void;
  verifyPhone(): void;
  toggleCategory(id: string): void;
}

function registrationHarness(c: Registration): RegistrationTestHarness {
  return c as unknown as RegistrationTestHarness;
}

describe('Registration', () => {
  let fixture: ComponentFixture<Registration>;
  let component: Registration;
  let reg: RegistrationStateService;

  beforeEach(async () => {
    const catalog = buildLocationCatalogResponse();
    const authMock: Pick<
      AuthApi,
      | 'completeOnboardingRegistration'
      | 'getLocationCatalog'
      | 'getDivisionsByCountry'
      | 'getMunicipalitiesByDivision'
      | 'isEmailAvailable'
      | 'isPhoneAvailable'
    > = {
      completeOnboardingRegistration: () => of(void 0),
      getLocationCatalog: () => of(catalog),
      getDivisionsByCountry: (countryCode: string) =>
        of({
          countryCode: countryCode.toUpperCase(),
          divisions: [...(catalog[countryCode.toUpperCase() as keyof typeof catalog]?.divisions ?? [])],
        }),
      getMunicipalitiesByDivision: (countryCode: string, division: string) =>
        of({
          countryCode: countryCode.toUpperCase(),
          division,
          municipalities: [
            ...(catalog[countryCode.toUpperCase() as keyof typeof catalog]?.municipalitiesByDivision[
              division
            ] ?? []),
          ],
        }),
      isEmailAvailable: () => of(true),
      isPhoneAvailable: () => of(true),
    };

    await TestBed.configureTestingModule({
      imports: [Registration],
      providers: [
        provideRouter([]),
        { provide: AuthApi, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Registration);
    component = fixture.componentInstance;
    reg = TestBed.inject(RegistrationStateService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('completes happy path for CLIENT', async () => {
    expect(reg.vm().stage).toBe('ACCOUNT');

    const c = registrationHarness(component);
    c.accountForm.setValue({
      fullName: 'Test User',
      email: 'user@anyjobs.test',
      phoneNumber: '+34123456789',
      password: 'Aa1!aaaa',
      acceptTerms: true,
      selectedRoles: ['CLIENT'],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 400));

    c.onAccountContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('VERIFY');

    c.verifyForm.controls['emailOtp'].setValue('1234');
    c.verifyEmail();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().emailVerified).toBe(true);

    c.onVerifyContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('LOCATION');

    c.locationForm.setValue({
      countryCode: 'CO',
      city: 'Bogotá D.C.',
      municipality: 'Bogotá',
      area: 'Chapinero',
      coverageRadiusKm: null,
    });

    c.onLocationContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('ROLE_PROFILE');

    c.finish();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('PERSONAL_INFO');

    c.onPersonalContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('DONE');
    expect(reg.vm().active).toBe(true);
  });

  it('does not allow WORKER to finalize without categories', async () => {
    reg.reset();
    fixture.detectChanges();
    await fixture.whenStable();

    const c = registrationHarness(component);
    c.accountForm.setValue({
      fullName: 'Worker User',
      email: 'worker@anyjobs.test',
      phoneNumber: '+34987654321',
      password: 'Aa1!aaaa',
      acceptTerms: true,
      selectedRoles: ['WORKER'],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 400));

    c.onAccountContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('VERIFY');

    c.verifyForm.controls['smsOtp'].setValue('1234');
    c.verifyPhone();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().phoneVerified).toBe(true);

    c.onVerifyContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('LOCATION');

    c.locationForm.setValue({
      countryCode: 'AR',
      city: 'Ciudad Autónoma de Buenos Aires',
      municipality: 'Ciudad Autónoma de Buenos Aires',
      area: 'Palermo',
      coverageRadiusKm: null,
    });
    c.onLocationContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('ROLE_PROFILE');

    c.finish();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('ROLE_PROFILE');

    c.toggleCategory('limpieza');
    fixture.detectChanges();
    await fixture.whenStable();

    c.finish();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('PERSONAL_INFO');

    c.personalForm.setValue({
      documentType: 'CC',
      documentNumber: '1234567890',
      birthDate: '1990-01-01',
      gender: 'MALE',
      nationality: 'CO',
    });
    c.onPersonalContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('DONE');
    expect(reg.vm().listable).toBe(true);
  });

  it('does not complete WORKER personal step without required fields', async () => {
    reg.reset();
    reg.setStage('PERSONAL_INFO');
    reg.setEmailVerified(true);
    reg.setPhoneVerified(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const c = registrationHarness(component);
    c.accountForm.controls['selectedRoles'].setValue(['WORKER']);
    fixture.detectChanges();
    await fixture.whenStable();
    c.personalForm.setValue({
      documentType: 'PASSPORT',
      documentNumber: 'AB123456',
      birthDate: '1990-01-01',
      gender: '',
      nationality: '',
    });
    c.onPersonalContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('PERSONAL_INFO');
  });
});

