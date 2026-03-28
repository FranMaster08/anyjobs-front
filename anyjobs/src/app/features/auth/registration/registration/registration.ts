import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, of, switchMap, type Observable } from 'rxjs';

import { RegistrationStateService } from '../registration-state.service';
import {
  ClientProfileFormVM,
  LocationFormVM,
  PersonalInfoFormVM,
  RegisterFormVM,
  UserRole,
  WorkerProfileFormVM,
} from '../registration.models';
import {
  DOCUMENT_TYPE_LABEL_KEY,
  DOCUMENT_TYPE_OPTIONS,
  GENDER_LABEL_KEY,
  GENDER_OPTIONS,
  PAYMENT_METHOD_LABEL_KEY,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
  REGISTRATION_STAGES,
  ROLE_LABEL_KEY,
  ROLE_OPTIONS,
  STAGE_LABEL_KEY,
  WORKER_CATEGORY_LABEL_KEY,
  WORKER_CATEGORY_OPTIONS,
  type WorkerCategory,
} from '../registration.constants';
import { e164PhoneValidator, rolesRequiredValidator, strongPasswordValidator } from '../registration.validators';
import { emailTakenAsyncValidator, phoneTakenAsyncValidator } from '../registration.async-validators';
import { AuthApi } from '../../../../shared/api/auth.api';
import { clearApiError, setApiError } from '../../../../shared/api/api-error.utils';
import { I18nService } from '../../../../shared/i18n/i18n.service';

@Component({
  selector: 'app-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class Registration {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  protected readonly reg = inject(RegistrationStateService);
  protected readonly i18n = inject(I18nService);
  private readonly authApi = inject(AuthApi);

  protected readonly vm = this.reg.vm;
  protected readonly stage = computed(() => this.vm().stage);
  protected readonly t = (key: string) => this.i18n.t(key);

  protected readonly stages = REGISTRATION_STAGES;
  protected readonly stageLabelKey = STAGE_LABEL_KEY;
  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly roleLabelKey = ROLE_LABEL_KEY;
  protected readonly categoryOptions: readonly WorkerCategory[] = WORKER_CATEGORY_OPTIONS;
  protected readonly categoryLabelKey: Record<WorkerCategory, string> = WORKER_CATEGORY_LABEL_KEY;
  protected readonly paymentOptions: readonly PaymentMethod[] = PAYMENT_METHOD_OPTIONS;
  protected readonly paymentLabelKey: Record<PaymentMethod, string> = PAYMENT_METHOD_LABEL_KEY;
  protected readonly documentTypeOptions = DOCUMENT_TYPE_OPTIONS;
  protected readonly documentTypeLabelKey = DOCUMENT_TYPE_LABEL_KEY;
  protected readonly genderOptions = GENDER_OPTIONS;
  protected readonly genderLabelKey = GENDER_LABEL_KEY;

  protected readonly isBusy = signal(false);

  protected readonly accountForm = this.fb.nonNullable.group({
    fullName: this.fb.nonNullable.control<RegisterFormVM['fullName']>('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    email: this.fb.nonNullable.control<RegisterFormVM['email']>(
      '',
      [Validators.required, Validators.email],
      [emailTakenAsyncValidator(this.authApi)],
    ),
    phoneNumber: this.fb.nonNullable.control<RegisterFormVM['phoneNumber']>(
      '',
      [Validators.required, e164PhoneValidator()],
      [phoneTakenAsyncValidator(this.authApi)],
    ),
    password: this.fb.nonNullable.control<RegisterFormVM['password']>('', [
      Validators.required,
      strongPasswordValidator(),
    ]),
    acceptTerms: this.fb.nonNullable.control<RegisterFormVM['acceptTerms']>(false, [
      Validators.requiredTrue,
    ]),
    selectedRoles: this.fb.nonNullable.control<RegisterFormVM['selectedRoles']>([], [rolesRequiredValidator()]),
  });

  protected readonly verifyForm = this.fb.nonNullable.group({
    emailOtp: this.fb.nonNullable.control(''),
    smsOtp: this.fb.nonNullable.control(''),
  });

  protected readonly locationForm = this.fb.nonNullable.group({
    countryCode: this.fb.nonNullable.control<LocationFormVM['countryCode']>(''),
    city: this.fb.nonNullable.control<LocationFormVM['city']>('', [Validators.required]),
    area: this.fb.nonNullable.control<LocationFormVM['area']>(''),
    coverageRadiusKm: this.fb.nonNullable.control<LocationFormVM['coverageRadiusKm'] | null>(null),
  });

  protected readonly workerProfileForm = this.fb.nonNullable.group({
    categories: this.fb.nonNullable.control<WorkerProfileFormVM['categories']>([], [
      Validators.required,
      Validators.minLength(1),
    ]),
    headline: this.fb.nonNullable.control<WorkerProfileFormVM['headline']>(''),
    bio: this.fb.nonNullable.control<WorkerProfileFormVM['bio']>(''),
  });

  protected readonly clientProfileForm = this.fb.nonNullable.group({
    preferredPaymentMethod: this.fb.nonNullable.control<ClientProfileFormVM['preferredPaymentMethod'] | ''>(''),
  });

  protected readonly personalForm = this.fb.nonNullable.group({
    documentType: this.fb.nonNullable.control<PersonalInfoFormVM['documentType'] | ''>(''),
    documentNumber: this.fb.nonNullable.control<PersonalInfoFormVM['documentNumber']>(''),
    birthDate: this.fb.nonNullable.control<PersonalInfoFormVM['birthDate']>(''),
    gender: this.fb.nonNullable.control<PersonalInfoFormVM['gender'] | ''>(''),
    nationality: this.fb.nonNullable.control<PersonalInfoFormVM['nationality']>(''),
  });

  protected readonly roles = computed(() => this.vm().roles);
  protected readonly isWorker = computed(() => this.roles().includes('WORKER'));
  protected readonly isClient = computed(() => this.roles().includes('CLIENT'));

  protected readonly canContinueVerify = computed(() => {
    const s = this.vm();
    if (this.isWorker() && !s.phoneVerified) return false;
    if (!this.isWorker() && !this.isClient()) return false;
    // CLIENT: allow continue with at least one verification
    if (this.isClient() && !this.isWorker() && !(s.emailVerified || s.phoneVerified)) return false;
    // WORKER: phone verified is enough for MVP
    if (this.isWorker() && s.phoneVerified) return true;
    return s.emailVerified || s.phoneVerified;
  });

  constructor() {
    this.accountForm.controls.selectedRoles.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roles) => {
        this.reg.setRoles(roles);
        this.updatePersonalValidators(roles);
      });

    this.workerProfileForm.controls.categories.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cats) => this.reg.setWorkerCategoriesCount(cats.length));
  }

  private updatePersonalValidators(roles: UserRole[]): void {
    const worker = roles.includes('WORKER');

    const type = this.personalForm.controls.documentType;
    const num = this.personalForm.controls.documentNumber;
    const dob = this.personalForm.controls.birthDate;

    if (worker) {
      type.setValidators([Validators.required]);
      num.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(24)]);
      dob.setValidators([Validators.required]);
    } else {
      type.clearValidators();
      num.clearValidators();
      dob.clearValidators();
    }

    type.updateValueAndValidity({ emitEvent: false });
    num.updateValueAndValidity({ emitEvent: false });
    dob.updateValueAndValidity({ emitEvent: false });
  }

  protected toggleRole(role: UserRole): void {
    const next = new Set(this.accountForm.controls.selectedRoles.value);
    if (next.has(role)) next.delete(role);
    else next.add(role);
    this.accountForm.controls.selectedRoles.setValue([...next]);
    this.accountForm.controls.selectedRoles.markAsTouched();
  }

  protected onAccountContinue(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    const value = this.accountForm.getRawValue();

    this.isBusy.set(true);
    clearApiError(this.accountForm);

    this.authApi
      .register({
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        phoneNumber: value.phoneNumber.trim(),
        password: value.password,
        roles: value.selectedRoles,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.reg.setStatus(res.status);
          this.reg.setStage(res.nextStage);
        },
        error: (err: unknown) => {
          setApiError(this.accountForm, err);
        },
      });
  }

  protected verifyEmail(): void {
    const otp = this.verifyForm.controls.emailOtp.value.trim();
    if (otp.length < 4) {
      this.verifyForm.controls.emailOtp.setErrors({ otpInvalid: true });
      this.verifyForm.controls.emailOtp.markAsTouched();
      return;
    }
    this.isBusy.set(true);
    clearApiError(this.verifyForm.controls.emailOtp);

    this.authApi
      .verifyEmail({ otpCode: otp })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.reg.setEmailVerified(true);
        },
        error: (err: unknown) => {
          setApiError(this.verifyForm.controls.emailOtp, err);
        },
      });
  }

  protected verifyPhone(): void {
    const otp = this.verifyForm.controls.smsOtp.value.trim();
    if (otp.length < 4) {
      this.verifyForm.controls.smsOtp.setErrors({ otpInvalid: true });
      this.verifyForm.controls.smsOtp.markAsTouched();
      return;
    }
    this.isBusy.set(true);
    clearApiError(this.verifyForm.controls.smsOtp);

    this.authApi
      .verifyPhone({ otpCode: otp })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.reg.setPhoneVerified(true);
        },
        error: (err: unknown) => {
          setApiError(this.verifyForm.controls.smsOtp, err);
        },
      });
  }

  protected onVerifyContinue(): void {
    if (!this.canContinueVerify()) return;
    this.reg.setStage('LOCATION');
  }

  protected onLocationContinue(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }
    const value = this.locationForm.getRawValue();
    const payload = {
      city: value.city.trim(),
      area: value.area?.trim() ? value.area.trim() : undefined,
      countryCode: value.countryCode?.trim() ? value.countryCode.trim() : undefined,
      coverageRadiusKm: this.isWorker() && typeof value.coverageRadiusKm === 'number' ? value.coverageRadiusKm : undefined,
    };

    this.isBusy.set(true);
    clearApiError(this.locationForm);

    this.authApi
      .updateRegistrationLocation(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: () => this.reg.setStage('ROLE_PROFILE'),
        error: (err: unknown) => setApiError(this.locationForm, err),
      });
  }

  protected toggleCategory(category: string): void {
    const current = new Set(this.workerProfileForm.controls.categories.value);
    if (current.has(category)) current.delete(category);
    else current.add(category);
    this.workerProfileForm.controls.categories.setValue([...current]);
    this.workerProfileForm.controls.categories.markAsTouched();
  }

  protected finish(): void {
    if (this.isWorker() && this.workerProfileForm.invalid) {
      this.workerProfileForm.markAllAsTouched();
      return;
    }
    this.isBusy.set(true);
    clearApiError(this.workerProfileForm);

    const ops: Observable<unknown>[] = [];
    if (this.isWorker()) {
      const worker = this.workerProfileForm.getRawValue();
      ops.push(
        this.authApi.updateRegistrationWorkerProfile({
          categories: worker.categories,
          headline: worker.headline?.trim() ? worker.headline.trim() : undefined,
          bio: worker.bio?.trim() ? worker.bio.trim() : undefined,
        }),
      );
    }
    if (this.isClient()) {
      const client = this.clientProfileForm.getRawValue();
      if (client.preferredPaymentMethod) {
        ops.push(
          this.authApi.updateRegistrationClientProfile({
            preferredPaymentMethod: client.preferredPaymentMethod,
          }),
        );
      }
    }

    const done$ = ops.length > 0 ? forkJoin(ops) : of([]);

    done$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.reg.setStage('PERSONAL_INFO');
        },
        error: (err: unknown) => {
          setApiError(this.workerProfileForm, err);
        },
      });
  }

  protected onPersonalContinue(): void {
    if (this.isWorker() && this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    const value = this.personalForm.getRawValue();
    const payload = {
      documentType: value.documentType ? value.documentType : undefined,
      documentNumber: value.documentNumber?.trim() ? value.documentNumber.trim() : undefined,
      birthDate: value.birthDate?.trim() ? value.birthDate.trim() : undefined,
      gender: value.gender ? value.gender : undefined,
      nationality: value.nationality?.trim() ? value.nationality.trim() : undefined,
    };

    const hasAny =
      payload.documentType ||
      payload.documentNumber ||
      payload.birthDate ||
      payload.gender ||
      payload.nationality;

    // Si no hay datos (CLIENT) no bloqueamos el flujo.
    if (!hasAny) {
      this.completeRegistration();
      return;
    }

    this.isBusy.set(true);
    clearApiError(this.personalForm);

    this.authApi
      .updateRegistrationPersonalInfo(payload)
      .pipe(
        switchMap(() => this.authApi.completeRegistration()),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.reg.setStatus('ACTIVE');
          this.reg.setStage('DONE');
        },
        error: (err: unknown) => setApiError(this.personalForm, err),
      });
  }

  private completeRegistration(): void {
    this.isBusy.set(true);
    clearApiError(this.personalForm);

    this.authApi
      .completeRegistration()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.reg.setStatus('ACTIVE');
          this.reg.setStage('DONE');
        },
        error: (err: unknown) => setApiError(this.personalForm, err),
      });
  }

  protected back(): void {
    const stage = this.stage();
    if (stage === 'VERIFY') this.reg.setStage('ACCOUNT');
    else if (stage === 'LOCATION') this.reg.setStage('VERIFY');
    else if (stage === 'ROLE_PROFILE') this.reg.setStage('LOCATION');
    else if (stage === 'PERSONAL_INFO') this.reg.setStage('ROLE_PROFILE');
  }
}

