import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, merge } from 'rxjs';

import { RegistrationStateService } from '../registration-state.service';
import {
  RegistrationDraft,
  RegistrationDraftService,
} from '../registration-draft.service';
import {
  ClientProfileFormVM,
  LocationFormVM,
  PersonalInfoFormVM,
  RegisterFormVM,
  RegistrationStateVM,
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
  SUPPORTED_COUNTRY_OPTIONS,
  STAGE_LABEL_KEY,
  WORKER_CATEGORY_LABEL_KEY,
  WORKER_CATEGORY_OPTIONS,
  type SupportedCountryCode,
  type WorkerCategory,
} from '../registration.constants';
import {
  cityInCountryValidator,
  e164PhoneValidator,
  isoCountryCodeValidator,
  minimumAgeValidator,
  municipalityInDivisionValidator,
  rolesRequiredValidator,
  strongPasswordValidator,
} from '../registration.validators';
import {
  getWorldCountryName,
  WORLD_COUNTRY_OPTIONS,
} from '../../../../shared/location/world-countries.data';
import { LocationGeographyService } from '../../../../shared/location/location-geography.service';
import { emailTakenAsyncValidator, phoneTakenAsyncValidator } from '../registration.async-validators';
import { AuthApi } from '../../../../shared/api/auth.api';
import { clearApiError } from '../../../../shared/api/api-error.utils';
import {
  logRegistrationError,
  mapRegistrationErrorToMessage,
} from '../../../../shared/api/registration-error.utils';
import {
  ACCOUNT_CONTROL_ERRORS,
  applyRegistrationApiFieldErrors,
  collectFormControlMessages,
  hasInvalidControls,
  LOCATION_CONTROL_ERRORS,
  PERSONAL_CONTROL_ERRORS,
  WORKER_PROFILE_CONTROL_ERRORS,
} from '../registration-form-errors';
import type { CompleteOnboardingRegistrationRequest } from '../../../../shared/api/auth.models';
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  /** Fuerza recomputar pending/async con OnPush. */
  private readonly formStatusTick = signal(0);
  protected readonly accountValidationAttempted = signal(false);
  protected readonly locationValidationAttempted = signal(false);
  protected readonly personalValidationAttempted = signal(false);
  protected readonly profileValidationAttempted = signal(false);
  protected readonly reg = inject(RegistrationStateService);
  protected readonly i18n = inject(I18nService);
  private readonly authApi = inject(AuthApi);
  private readonly draftService = inject(RegistrationDraftService);
  private readonly locationGeography = inject(LocationGeographyService);

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
  protected readonly countryOptions = SUPPORTED_COUNTRY_OPTIONS;

  protected readonly nationalityOptions = computed(() => {
    const locale = this.i18n.lang() === 'en' ? 'en' : 'es';
    return WORLD_COUNTRY_OPTIONS.map((country) => ({
      code: country.code,
      label: getWorldCountryName(country.code, locale) ?? country.name,
    })).sort((a, b) => a.label.localeCompare(b.label, locale));
  });

  /** Fecha máxima permitida: hoy menos 18 años (mayor de edad). */
  protected readonly birthDateMax = computed(() => {
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() - 18);
    return limit.toISOString().slice(0, 10);
  });

  protected readonly submitFieldErrors = signal<string[]>([]);

  protected readonly accountErrorSummary = computed(() =>
    this.dedupeMessages([
      ...collectFormControlMessages(
        this.accountForm,
        ACCOUNT_CONTROL_ERRORS,
        this.accountValidationAttempted(),
        (key) => this.t(key),
      ),
    ]),
  );

  protected readonly locationErrorSummary = computed(() => {
    const messages = this.dedupeMessages([
      ...collectFormControlMessages(
        this.locationForm,
        LOCATION_CONTROL_ERRORS,
        this.locationValidationAttempted(),
        (key) => this.t(key),
      ),
    ]);
    const generic = this.t('reg.error.validation');
    const specific = messages.filter((message) => message !== generic);
    return specific.length > 0 ? specific : messages;
  });

  protected readonly personalErrorSummary = computed(() => {
    const messages = this.dedupeMessages([
      ...collectFormControlMessages(
        this.personalForm,
        PERSONAL_CONTROL_ERRORS,
        this.personalValidationAttempted(),
        (key) => this.t(key),
      ),
      ...this.submitFieldErrors(),
    ]);
    const generic = this.t('reg.error.validation');
    const specific = messages.filter((message) => message !== generic);
    return specific.length > 0 ? specific : messages;
  });

  protected readonly profileErrorSummary = computed(() =>
    this.dedupeMessages([
      ...collectFormControlMessages(
        this.workerProfileForm,
        WORKER_PROFILE_CONTROL_ERRORS,
        this.profileValidationAttempted(),
        (key) => this.t(key),
      ),
    ]),
  );

  protected readonly isBusy = signal(false);
  protected readonly resumedRegistration = signal(false);

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
    countryCode: this.fb.nonNullable.control<LocationFormVM['countryCode']>('', [Validators.required]),
    city: this.fb.nonNullable.control<LocationFormVM['city']>('', [Validators.required]),
    municipality: this.fb.nonNullable.control<LocationFormVM['municipality']>('', [Validators.required]),
    area: this.fb.nonNullable.control<LocationFormVM['area']>('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(120),
    ]),
    coverageRadiusKm: this.fb.nonNullable.control<LocationFormVM['coverageRadiusKm'] | null>(null),
  });

  protected readonly locationCityOptions = computed(() => {
    this.formStatusTick();
    this.locationGeography.divisionsLoaded();
    const code = this.locationForm.controls.countryCode.value;
    return code ? [...this.locationGeography.divisions(code)] : [];
  });

  protected readonly locationMunicipalityOptions = computed(() => {
    this.formStatusTick();
    this.locationGeography.municipalitiesLoaded();
    const code = this.locationForm.controls.countryCode.value;
    const division = this.locationForm.controls.city.value;
    return code && division ? [...this.locationGeography.municipalities(code, division)] : [];
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

  protected readonly accountFormPending = computed(() => {
    this.formStatusTick();
    return this.accountForm.controls.email.pending || this.accountForm.controls.phoneNumber.pending;
  });

  protected readonly accountContinueBlocked = computed(
    () => this.isBusy() || this.accountFormPending(),
  );

  protected readonly verifyContinueHint = computed(() => {
    const s = this.vm();
    if (this.isWorker() && !s.phoneVerified) {
      return this.t('reg.error.phoneVerification');
    }
    if (this.isClient() && !this.isWorker() && !(s.emailVerified || s.phoneVerified)) {
      return this.t('reg.error.contactVerification');
    }
    if (!this.isWorker() && !this.isClient()) {
      return this.t('error.rolesRequired');
    }
    return null;
  });

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
    merge(
      this.accountForm.statusChanges,
      this.accountForm.controls.email.statusChanges,
      this.accountForm.controls.phoneNumber.statusChanges,
      this.locationForm.statusChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formStatusTick.update((n) => n + 1);
        this.cdr.markForCheck();
      });

    this.accountForm.controls.selectedRoles.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roles) => {
        this.reg.setRoles(roles);
        this.updatePersonalValidators(roles);
      });

    this.workerProfileForm.controls.categories.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cats) => this.reg.setWorkerCategoriesCount(cats.length));

    this.locationForm.controls.city.addValidators(
      cityInCountryValidator(() => this.locationForm.controls.countryCode.value),
    );
    this.locationForm.controls.municipality.addValidators(
      municipalityInDivisionValidator(
        () => this.locationForm.controls.countryCode.value,
        () => this.locationForm.controls.city.value,
      ),
    );
    this.locationGeography
      .ensureCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formStatusTick.update((n) => n + 1);
        this.cdr.markForCheck();
      });

    this.locationForm.controls.countryCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((countryCode) => {
        this.locationForm.controls.city.setValue('');
        this.locationForm.controls.municipality.setValue('');
        this.locationForm.controls.area.setValue('');
        this.locationForm.controls.city.markAsUntouched();
        this.locationForm.controls.municipality.markAsUntouched();
        this.locationForm.controls.area.markAsUntouched();
        this.locationForm.controls.city.updateValueAndValidity({ emitEvent: false });
        this.locationForm.controls.municipality.updateValueAndValidity({ emitEvent: false });
        this.locationForm.controls.area.updateValueAndValidity({ emitEvent: false });

        if (countryCode) {
          this.locationGeography
            .loadDivisionsForCountry(countryCode)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.formStatusTick.update((n) => n + 1);
              this.cdr.markForCheck();
            });
        } else {
          this.formStatusTick.update((n) => n + 1);
          this.cdr.markForCheck();
        }
      });

    this.locationForm.controls.city.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((division) => {
        this.locationForm.controls.municipality.setValue('');
        this.locationForm.controls.area.setValue('');
        this.locationForm.controls.municipality.markAsUntouched();
        this.locationForm.controls.area.markAsUntouched();
        this.locationForm.controls.municipality.updateValueAndValidity({ emitEvent: false });
        this.locationForm.controls.area.updateValueAndValidity({ emitEvent: false });

        const countryCode = this.locationForm.controls.countryCode.value;
        if (countryCode && division) {
          this.locationGeography
            .loadMunicipalitiesForDivision(countryCode, division)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.formStatusTick.update((n) => n + 1);
              this.cdr.markForCheck();
            });
        } else {
          this.cdr.markForCheck();
        }
      });

    this.locationForm.controls.municipality.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.locationForm.controls.area.setValue('');
        this.locationForm.controls.area.markAsUntouched();
        this.locationForm.controls.area.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    const draft = this.draftService.load();
    if (draft) {
      this.applyDraft(draft);
    }
  }

  private applyDraft(draft: RegistrationDraft): void {
    if (draft.stage === 'DONE' || !REGISTRATION_STAGES.includes(draft.stage)) {
      this.draftService.clear();
      return;
    }

    this.resumedRegistration.set(true);
    this.reg.setStage(draft.stage);
    this.reg.setStatus(draft.status);
    if (draft.emailVerified) this.reg.setEmailVerified(true);
    if (draft.phoneVerified) this.reg.setPhoneVerified(true);

    if (draft.account) {
      this.reg.setRoles(draft.account.roles);
      this.accountForm.patchValue({
        fullName: draft.account.fullName,
        email: draft.account.email,
        phoneNumber: draft.account.phoneNumber,
        password: draft.account.password,
        selectedRoles: draft.account.roles,
      });
      this.updatePersonalValidators(draft.account.roles);
    }

    if (draft.location) {
      this.locationForm.patchValue(draft.location);
      if (draft.location.countryCode) {
        this.locationGeography
          .loadDivisionsForCountry(draft.location.countryCode)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (draft.location?.city) {
              this.locationGeography
                .loadMunicipalitiesForDivision(draft.location.countryCode, draft.location.city)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                  this.formStatusTick.update((n) => n + 1);
                  this.cdr.markForCheck();
                });
            } else {
              this.formStatusTick.update((n) => n + 1);
              this.cdr.markForCheck();
            }
          });
      }
    }

    if (draft.workerProfile) {
      this.workerProfileForm.patchValue(draft.workerProfile);
      this.reg.setWorkerCategoriesCount(draft.workerProfile.categories.length);
    }

    if (draft.clientProfile?.preferredPaymentMethod) {
      this.clientProfileForm.patchValue({
        preferredPaymentMethod: draft.clientProfile.preferredPaymentMethod as ClientProfileFormVM['preferredPaymentMethod'],
      });
    }

    if (draft.personal) {
      this.personalForm.patchValue({
        documentType: draft.personal.documentType as PersonalInfoFormVM['documentType'],
        documentNumber: draft.personal.documentNumber,
        birthDate: draft.personal.birthDate,
        gender: draft.personal.gender as PersonalInfoFormVM['gender'],
        nationality: draft.personal.nationality,
      });
    }
  }

  private persistDraft(stage: RegistrationStateVM['stage']): void {
    const accountValue = this.accountForm.getRawValue();
    const locationValue = this.locationForm.getRawValue();
    const workerValue = this.workerProfileForm.getRawValue();
    const clientValue = this.clientProfileForm.getRawValue();
    const personalValue = this.personalForm.getRawValue();
    const vm = this.reg.vm();

    const draft: RegistrationDraft = {
      stage,
      status: vm.status,
      emailVerified: vm.emailVerified,
      phoneVerified: vm.phoneVerified,
      account: {
        fullName: accountValue.fullName.trim(),
        email: accountValue.email.trim(),
        phoneNumber: accountValue.phoneNumber.trim(),
        password: accountValue.password,
        roles: accountValue.selectedRoles,
      },
      location: {
        countryCode: locationValue.countryCode.trim(),
        city: locationValue.city.trim(),
        municipality: locationValue.municipality.trim(),
        area: locationValue.area.trim(),
        coverageRadiusKm: locationValue.coverageRadiusKm ?? null,
      },
      workerProfile: {
        categories: workerValue.categories,
        headline: workerValue.headline ?? '',
        bio: workerValue.bio ?? '',
      },
      clientProfile: clientValue.preferredPaymentMethod
        ? { preferredPaymentMethod: clientValue.preferredPaymentMethod }
        : undefined,
      personal: {
        documentType: personalValue.documentType ?? '',
        documentNumber: personalValue.documentNumber ?? '',
        birthDate: personalValue.birthDate ?? '',
        gender: personalValue.gender ?? '',
        nationality: personalValue.nationality ?? '',
      },
    };

    this.draftService.save(draft);
  }

  protected showAccountError(control: AbstractControl): boolean {
    return (control.touched || this.accountValidationAttempted()) && control.invalid;
  }

  protected showLocationError(control: AbstractControl): boolean {
    return (control.touched || this.locationValidationAttempted()) && control.invalid;
  }

  protected showPersonalError(control: AbstractControl): boolean {
    return (control.touched || this.personalValidationAttempted()) && control.invalid;
  }

  protected showProfileCategoriesError(): boolean {
    const c = this.workerProfileForm.controls.categories;
    return (c.touched || this.profileValidationAttempted()) && c.invalid;
  }

  private dedupeMessages(messages: string[]): string[] {
    return [...new Set(messages.filter((message) => message.trim().length > 0))];
  }

  private clearLocationServerErrors(): void {
    for (const name of Object.keys(LOCATION_CONTROL_ERRORS)) {
      const control = this.locationForm.get(name);
      if (!control?.errors?.['server']) continue;
      const { server, ...rest } = control.errors ?? {};
      void server;
      control.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }
  }

  private updatePersonalValidators(roles: UserRole[]): void {
    const worker = roles.includes('WORKER');

    const type = this.personalForm.controls.documentType;
    const num = this.personalForm.controls.documentNumber;
    const dob = this.personalForm.controls.birthDate;
    const gender = this.personalForm.controls.gender;
    const nationality = this.personalForm.controls.nationality;

    if (worker) {
      type.setValidators([Validators.required]);
      num.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(24)]);
      dob.setValidators([Validators.required, minimumAgeValidator(18)]);
      gender.setValidators([Validators.required]);
      nationality.setValidators([Validators.required, isoCountryCodeValidator()]);
    } else {
      type.clearValidators();
      num.clearValidators();
      dob.clearValidators();
      gender.clearValidators();
      nationality.clearValidators();
    }

    type.updateValueAndValidity({ emitEvent: false });
    num.updateValueAndValidity({ emitEvent: false });
    dob.updateValueAndValidity({ emitEvent: false });
    gender.updateValueAndValidity({ emitEvent: false });
    nationality.updateValueAndValidity({ emitEvent: false });
  }

  protected toggleRole(role: UserRole): void {
    const next = new Set(this.accountForm.controls.selectedRoles.value);
    if (next.has(role)) next.delete(role);
    else next.add(role);
    this.accountForm.controls.selectedRoles.setValue([...next]);
    this.accountForm.controls.selectedRoles.markAsTouched();
  }

  protected onAccountContinue(): void {
    this.accountValidationAttempted.set(true);
    if (this.accountForm.invalid || this.accountFormPending()) {
      this.accountForm.markAllAsTouched();
      return;
    }

    clearApiError(this.accountForm);
    const value = this.accountForm.getRawValue();
    this.reg.setRoles(value.selectedRoles);
    this.reg.setStatus('PENDING');
    this.reg.setStage('VERIFY');
    this.persistDraft('VERIFY');
  }

  protected verifyEmail(): void {
    const otp = this.verifyForm.controls.emailOtp.value.trim();
    if (otp.length < 4) {
      this.verifyForm.controls.emailOtp.setErrors({ otpInvalid: true });
      this.verifyForm.controls.emailOtp.markAsTouched();
      return;
    }
    clearApiError(this.verifyForm.controls.emailOtp);
    this.reg.setEmailVerified(true);
    this.persistDraft(this.stage());
  }

  protected verifyPhone(): void {
    const otp = this.verifyForm.controls.smsOtp.value.trim();
    if (otp.length < 4) {
      this.verifyForm.controls.smsOtp.setErrors({ otpInvalid: true });
      this.verifyForm.controls.smsOtp.markAsTouched();
      return;
    }
    clearApiError(this.verifyForm.controls.smsOtp);
    this.reg.setPhoneVerified(true);
    this.persistDraft(this.stage());
  }

  protected onVerifyContinue(): void {
    if (!this.canContinueVerify()) return;
    this.reg.setStage('LOCATION');
    this.persistDraft('LOCATION');
  }

  protected onLocationContinue(): void {
    this.locationValidationAttempted.set(true);
    this.clearLocationServerErrors();
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      this.submitFieldErrors.set(
        collectFormControlMessages(this.locationForm, LOCATION_CONTROL_ERRORS, true, (key) =>
          this.t(key),
        ),
      );
      this.cdr.markForCheck();
      return;
    }

    this.submitFieldErrors.set([]);
    clearApiError(this.locationForm);
    this.reg.setStage('ROLE_PROFILE');
    this.persistDraft('ROLE_PROFILE');
  }

  protected toggleCategory(category: string): void {
    const current = new Set(this.workerProfileForm.controls.categories.value);
    if (current.has(category)) current.delete(category);
    else current.add(category);
    this.workerProfileForm.controls.categories.setValue([...current]);
    this.workerProfileForm.controls.categories.markAsTouched();
  }

  protected finish(): void {
    this.profileValidationAttempted.set(true);
    if (this.isWorker() && this.workerProfileForm.invalid) {
      this.workerProfileForm.markAllAsTouched();
      return;
    }

    clearApiError(this.workerProfileForm);
    this.reg.setStage('PERSONAL_INFO');
    this.persistDraft('PERSONAL_INFO');
  }

  protected onPersonalContinue(): void {
    this.personalValidationAttempted.set(true);
    this.submitFieldErrors.set([]);

    if (this.isWorker()) {
      if (hasInvalidControls(this.personalForm)) {
        this.personalForm.markAllAsTouched();
        this.submitFieldErrors.set(
          collectFormControlMessages(this.personalForm, PERSONAL_CONTROL_ERRORS, true, (key) =>
            this.t(key),
          ),
        );
        this.cdr.markForCheck();
        return;
      }
      this.submitWorkerPersonalAndComplete();
      return;
    }

    this.completeRegistration();
  }

  private buildCompleteOnboardingPayload(): CompleteOnboardingRegistrationRequest {
    const account = this.accountForm.getRawValue();
    const location = this.locationForm.getRawValue();
    const vm = this.reg.vm();

    const payload: CompleteOnboardingRegistrationRequest = {
      account: {
        fullName: account.fullName.trim(),
        email: account.email.trim(),
        phoneNumber: account.phoneNumber.trim(),
        password: account.password,
        roles: account.selectedRoles,
      },
      emailVerified: vm.emailVerified,
      phoneVerified: vm.phoneVerified,
      location: {
        city: location.city.trim(),
        municipality: location.municipality.trim(),
        area: location.area.trim(),
        countryCode: location.countryCode.trim().toUpperCase(),
        coverageRadiusKm:
          this.isWorker() && typeof location.coverageRadiusKm === 'number'
            ? location.coverageRadiusKm
            : undefined,
      },
    };

    if (this.isWorker()) {
      const worker = this.workerProfileForm.getRawValue();
      payload.workerProfile = {
        categories: worker.categories,
        headline: worker.headline?.trim() ? worker.headline.trim() : undefined,
        bio: worker.bio?.trim() ? worker.bio.trim() : undefined,
      };

      const personal = this.personalForm.getRawValue();
      payload.personalInfo = {
        documentType: personal.documentType as string,
        documentNumber: (personal.documentNumber ?? '').trim(),
        birthDate: (personal.birthDate ?? '').trim(),
        gender: personal.gender as string,
        nationality: (personal.nationality ?? '').trim().toUpperCase(),
      };
    }

    if (this.isClient()) {
      const client = this.clientProfileForm.getRawValue();
      if (client.preferredPaymentMethod) {
        payload.preferredPaymentMethod = client.preferredPaymentMethod;
      }
    }

    return payload;
  }

  private submitCompleteOnboarding(): void {
    this.persistDraft('PERSONAL_INFO');
    const payload = this.buildCompleteOnboardingPayload();

    this.isBusy.set(true);
    clearApiError(this.personalForm);

    this.authApi
      .completeOnboardingRegistration(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.draftService.clear();
          this.reg.setStatus('ACTIVE');
          this.reg.setStage('DONE');
        },
        error: (err: unknown) => {
          logRegistrationError('complete-onboarding', err);
          clearApiError(this.personalForm);

          const messages = applyRegistrationApiFieldErrors(
            {
              account: this.accountForm,
              location: this.locationForm,
              personal: this.personalForm,
              workerProfile: this.workerProfileForm,
            },
            err,
            (key) => this.t(key),
          );

          this.submitFieldErrors.set(
            messages.length > 0
              ? messages
              : [mapRegistrationErrorToMessage(err, (key) => this.t(key))],
          );
          this.accountValidationAttempted.set(true);
          this.locationValidationAttempted.set(true);
          this.personalValidationAttempted.set(true);
          this.profileValidationAttempted.set(true);

          this.cdr.markForCheck();
        },
      });
  }

  private submitWorkerPersonalAndComplete(): void {
    this.submitCompleteOnboarding();
  }

  private completeRegistration(): void {
    this.submitCompleteOnboarding();
  }

  protected back(): void {
    const stage = this.stage();
    if (stage === 'VERIFY') this.reg.setStage('ACCOUNT');
    else if (stage === 'LOCATION') this.reg.setStage('VERIFY');
    else if (stage === 'ROLE_PROFILE') this.reg.setStage('LOCATION');
    else if (stage === 'PERSONAL_INFO') this.reg.setStage('ROLE_PROFILE');
  }
}

