import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Registration } from './registration';
import { RegistrationStateService } from '../registration-state.service';
import { AuthApi } from '../../../../shared/api/auth.api';
import { UserApi } from '../../../../shared/api/user.api';

describe('Registration', () => {
  let fixture: ComponentFixture<Registration>;
  let component: Registration;
  let reg: RegistrationStateService;

  beforeEach(async () => {
    const authMock: Pick<
      AuthApi,
      'register' | 'verifyEmail' | 'verifyPhone' | 'isEmailAvailable' | 'isPhoneAvailable'
    > = {
      register: () =>
        of({
          userId: 'user_1',
          status: 'PENDING',
          emailVerificationRequired: true,
          phoneVerificationRequired: false,
          nextStage: 'VERIFY',
        }),
      verifyEmail: () => of(void 0),
      verifyPhone: () => of(void 0),
      isEmailAvailable: () => of(true),
      isPhoneAvailable: () => of(true),
    };

    const userMock: Pick<
      UserApi,
      'updateLocation' | 'updateWorkerProfile' | 'updateClientProfile' | 'updatePersonalInfo'
    > = {
      updateLocation: () => of(void 0),
      updateWorkerProfile: () => of(void 0),
      updateClientProfile: () => of(void 0),
      updatePersonalInfo: () => of(void 0),
    };

    await TestBed.configureTestingModule({
      imports: [Registration],
      providers: [
        provideRouter([]),
        { provide: AuthApi, useValue: authMock },
        { provide: UserApi, useValue: userMock },
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

    const c = component as any;
    c.accountForm.setValue({
      fullName: 'Test User',
      email: 'user@anyjobs.test',
      phoneNumber: '+34123456789',
      password: 'Aa1!aaaa',
      acceptTerms: true,
      selectedRoles: ['CLIENT'],
    });

    c.onAccountContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('VERIFY');

    c.verifyForm.controls.emailOtp.setValue('1234');
    c.verifyEmail();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().emailVerified).toBe(true);

    c.onVerifyContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('LOCATION');

    c.locationForm.setValue({
      countryCode: 'ES',
      city: 'Madrid',
      area: '',
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

    const c = component as any;
    c.accountForm.setValue({
      fullName: 'Worker User',
      email: 'worker@anyjobs.test',
      phoneNumber: '+34987654321',
      password: 'Aa1!aaaa',
      acceptTerms: true,
      selectedRoles: ['WORKER'],
    });

    c.onAccountContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('VERIFY');

    c.verifyForm.controls.smsOtp.setValue('1234');
    c.verifyPhone();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().phoneVerified).toBe(true);

    c.onVerifyContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('LOCATION');

    c.locationForm.controls.city.setValue('Barcelona');
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
      documentType: 'DNI',
      documentNumber: '12345678A',
      birthDate: '1990-01-01',
      gender: '',
      nationality: 'ES',
    });
    c.onPersonalContinue();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reg.vm().stage).toBe('DONE');
    expect(reg.vm().listable).toBe(true);
  });
});

