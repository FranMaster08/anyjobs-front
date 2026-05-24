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
  type DocumentType,
  type Gender,
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
  PHONE_DIAL_OPTIONS,
  type PaymentMethod,
  REGISTRATION_STAGES,
  ROLE_LABEL_KEY,
  ROLE_OPTIONS,
  SUPPORTED_COUNTRY_OPTIONS,
  STAGE_LABEL_KEY,
  WORKER_CATEGORY_GROUPS,
  WORKER_CATEGORY_LABEL_KEY,
  WORKER_CATEGORY_OPTIONS,
  type WorkerCategory,
} from '../registration.constants';
import {
  cityInCountryValidator,
  e164PhoneValidator,
  isoCountryCodeValidator,
  minimumAgeValidator,
  municipalityInDivisionValidator,
  phoneDialCodeValidator,
  phoneLocalNumberValidator,
  rolesRequiredValidator,
  strongPasswordValidator,
} from '../registration.validators';
import {
  getWorldCountryName,
  WORLD_COUNTRY_OPTIONS,
} from '../../../../shared/location/world-countries.data';
import { LocationGeographyService } from '../../../../shared/location/location-geography.service';
import { emailTakenAsyncValidator, phoneTakenAsyncValidator } from '../registration.async-validators';
import { buildE164Phone, parseE164Phone, sanitizePhoneLocalInput } from '../phone.utils';
import { PasswordFieldComponent } from '../../../../shared/components/password-field/password-field';
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordFieldComponent],
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
  protected readonly categoryGroups = WORKER_CATEGORY_GROUPS;
  protected readonly categoryLabelKey: Record<WorkerCategory, string> = WORKER_CATEGORY_LABEL_KEY;
  protected readonly paymentOptions: readonly PaymentMethod[] = PAYMENT_METHOD_OPTIONS;
  protected readonly paymentLabelKey: Record<PaymentMethod, string> = PAYMENT_METHOD_LABEL_KEY;
  protected readonly documentTypeOptions = DOCUMENT_TYPE_OPTIONS;
  protected readonly documentTypeLabelKey = DOCUMENT_TYPE_LABEL_KEY;
  protected readonly genderOptions = GENDER_OPTIONS;
  protected readonly genderLabelKey = GENDER_LABEL_KEY;
  protected readonly countryOptions = SUPPORTED_COUNTRY_OPTIONS;
  protected readonly phoneDialOptions = PHONE_DIAL_OPTIONS;

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
  /** Refleja si la verificación por teléfono/SMS está habilitada. False por defecto mientras SMS esté deshabilitado. */
  protected readonly phoneVerificationEnabled = signal(false);

  /** Dígitos individuales del código de seguridad de email (6 cajas). */
  protected readonly emailOtpDigits = signal<string[]>(['', '', '', '', '', '']);
  /** Error visible bajo las cajas OTP del email. */
  protected readonly emailOtpError = signal<string | null>(null);
  /** Índices 0-5 para el @for del template. */
  protected readonly otpIndices = [0, 1, 2, 3, 4, 5] as const;
  /** True durante ~3 s después de reenviar el código para dar feedback visual. */
  protected readonly resendSent = signal(false);
  private resendTimer: ReturnType<typeof setTimeout> | null = null;

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
    phoneDialCode: this.fb.nonNullable.control('+57', [
      Validators.required,
      phoneDialCodeValidator(),
    ]),
    phoneLocalNumber: this.fb.nonNullable.control('', [
      Validators.required,
      phoneLocalNumberValidator(),
    ]),
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

  protected isStepDone(s: (typeof REGISTRATION_STAGES)[number]): boolean {
    return REGISTRATION_STAGES.indexOf(s) < REGISTRATION_STAGES.indexOf(this.stage());
  }

  protected readonly roles = computed(() => this.vm().roles);
  protected readonly isWorker = computed(() => this.roles().includes('WORKER'));
  protected readonly isClient = computed(() => this.roles().includes('CLIENT'));

  protected readonly doneSummary = computed(() => {
    const account = this.accountForm.getRawValue();
    const location = this.locationForm.getRawValue();
    const worker = this.workerProfileForm.getRawValue();
    const client = this.clientProfileForm.getRawValue();
    const personal = this.personalForm.getRawValue();
    const locale = this.i18n.lang() === 'en' ? 'en-US' : 'es-ES';

    const rolesLabel = this.roles()
      .map((role) => this.t(this.roleLabelKey[role]))
      .join(' · ');

    const locationParts = [location.area, location.municipality, location.city].filter(
      (part) => part.trim().length > 0,
    );
    const locationLabel = [
      locationParts.join(', '),
      this.locationCountryLabel(location.countryCode),
    ]
      .filter((part) => part.length > 0)
      .join(' · ');

    const categories = worker.categories.map((id) =>
      this.t(this.categoryLabelKey[id as WorkerCategory] ?? id),
    );

    let paymentMethodLabel: string | null = null;
    if (client.preferredPaymentMethod) {
      paymentMethodLabel = this.t(
        this.paymentLabelKey[client.preferredPaymentMethod as PaymentMethod],
      );
    }

    let documentLabel: string | null = null;
    let nationalityLabel: string | null = null;
    let birthDateLabel: string | null = null;
    let genderLabel: string | null = null;

    if (this.isWorker() && personal.documentType) {
      const docType = this.t(this.documentTypeLabelKey[personal.documentType as DocumentType]);
      const docNumber = (personal.documentNumber ?? '').trim();
      documentLabel = docNumber
        ? `${docType} · ${this.maskDocumentNumber(docNumber)}`
        : docType;
      if (personal.nationality) {
        nationalityLabel =
          this.nationalityOptions().find((c) => c.code === personal.nationality)?.label ??
          personal.nationality;
      }
      if (personal.birthDate) {
        birthDateLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
          new Date(`${personal.birthDate}T12:00:00`),
        );
      }
      if (personal.gender) {
        genderLabel = this.t(this.genderLabelKey[personal.gender as Gender]);
      }
    }

    return {
      fullName: account.fullName.trim(),
      email: account.email.trim(),
      phone: this.getAccountE164Phone(),
      rolesLabel,
      locationLabel,
      categories,
      paymentMethodLabel,
      documentLabel,
      nationalityLabel,
      birthDateLabel,
      genderLabel,
      createdAtLabel: new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
    };
  });

  protected readonly accountFormPending = computed(() => {
    this.formStatusTick();
    return (
      this.accountForm.controls.email.pending || this.accountForm.controls.phoneNumber.pending
    );
  });

  protected readonly accountContinueBlocked = computed(
    () => this.isBusy() || this.accountFormPending(),
  );

  protected readonly verifyContinueHint = computed(() => {
    const s = this.vm();
    if (!this.isWorker() && !this.isClient()) {
      return this.t('error.rolesRequired');
    }
    if (this.phoneVerificationEnabled() && this.isWorker() && !s.phoneVerified) {
      return this.t('reg.error.phoneVerification');
    }
    if (!s.emailVerified && !(this.phoneVerificationEnabled() && s.phoneVerified)) {
      return this.t('reg.error.emailVerification');
    }
    return null;
  });

  protected readonly canContinueVerify = computed(() => {
    const s = this.vm();
    if (!this.isWorker() && !this.isClient()) return false;
    if (this.phoneVerificationEnabled()) {
      // Con SMS habilitado: WORKER requiere teléfono verificado; CLIENT: al menos una verificación
      if (this.isWorker() && !s.phoneVerified) return false;
      if (this.isClient() && !this.isWorker() && !(s.emailVerified || s.phoneVerified)) return false;
      if (this.isWorker() && s.phoneVerified) return true;
      return s.emailVerified || s.phoneVerified;
    }
    // Con SMS deshabilitado: solo requiere email verificado
    return s.emailVerified;
  });

  constructor() {
    merge(
      this.accountForm.statusChanges,
      this.accountForm.controls.email.statusChanges,
      this.accountForm.controls.phoneDialCode.statusChanges,
      this.accountForm.controls.phoneLocalNumber.statusChanges,
      this.accountForm.controls.phoneNumber.statusChanges,
      this.locationForm.statusChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formStatusTick.update((n) => n + 1);
        this.cdr.markForCheck();
      });

    merge(
      this.accountForm.controls.phoneDialCode.valueChanges,
      this.accountForm.controls.phoneLocalNumber.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncPhoneNumberFromParts());

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
        password: draft.account.password,
        selectedRoles: draft.account.roles,
      });
      this.applyPhonePartsFromE164(draft.account.phoneNumber);
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
        phoneNumber: this.getAccountE164Phone(),
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
    this.syncPhoneNumberFromParts();
    this.accountValidationAttempted.set(true);
    if (this.accountForm.invalid || this.accountFormPending()) {
      this.accountForm.markAllAsTouched();
      return;
    }

    clearApiError(this.accountForm);
    const value = this.accountForm.getRawValue();

    this.isBusy.set(true);
    this.authApi
      .register({
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        phoneNumber: this.getAccountE164Phone(),
        password: value.password,
        roles: value.selectedRoles,
      })
      .pipe(finalize(() => this.isBusy.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.reg.setRoles(value.selectedRoles);
          this.reg.setStatus('PENDING');
          this.reg.setEmailVerified(false);
          this.reg.setStage('VERIFY');
          this.phoneVerificationEnabled.set(res.phoneVerificationRequired ?? false);
          this.emailOtpDigits.set(['', '', '', '', '', '']);
          this.emailOtpError.set(null);
          this.persistDraft('VERIFY');
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          logRegistrationError('register', err);
          const msg = mapRegistrationErrorToMessage(err, (k) => this.t(k));
          this.accountForm.setErrors({ api: msg });
          this.cdr.markForCheck();
        },
      });
  }

  protected verifyEmail(): void {
    const otp = this.emailOtpDigits().join('');
    this.emailOtpError.set(null);

    if (otp.length < 6 || this.emailOtpDigits().some((d) => !d)) {
      this.emailOtpError.set(this.t('error.otpInvalid'));
      document.getElementById('otp-digit-0')?.focus();
      return;
    }

    this.isBusy.set(true);
    this.authApi
      .verifyEmail({ otpCode: otp })
      .pipe(finalize(() => this.isBusy.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reg.setEmailVerified(true);
          this.persistDraft(this.stage());
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          logRegistrationError('verifyEmail', err);
          const msg = mapRegistrationErrorToMessage(err, (k) => this.t(k));
          this.emailOtpError.set(msg);
          this.emailOtpDigits.set(['', '', '', '', '', '']);
          document.getElementById('otp-digit-0')?.focus();
          this.cdr.markForCheck();
        },
      });
  }

  protected onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    const digit = raw.slice(-1);
    input.value = digit;

    const digits = [...this.emailOtpDigits()];
    digits[index] = digit;
    this.emailOtpDigits.set(digits);
    this.emailOtpError.set(null);

    if (digit && index < 5) {
      document.getElementById(`otp-digit-${index + 1}`)?.focus();
    }
  }

  protected onDigitKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const digits = [...this.emailOtpDigits()];
      if (digits[index]) {
        digits[index] = '';
        this.emailOtpDigits.set(digits);
      } else if (index > 0) {
        document.getElementById(`otp-digit-${index - 1}`)?.focus();
      }
      this.emailOtpError.set(null);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      document.getElementById(`otp-digit-${index - 1}`)?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      document.getElementById(`otp-digit-${index + 1}`)?.focus();
    }
  }

  protected onDigitPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const cleaned = text.replace(/\D/g, '').slice(0, 6).split('');
    while (cleaned.length < 6) cleaned.push('');
    this.emailOtpDigits.set(cleaned);
    this.emailOtpError.set(null);
    const focusIndex = Math.min(cleaned.filter(Boolean).length, 5);
    document.getElementById(`otp-digit-${focusIndex}`)?.focus();
    this.cdr.markForCheck();
  }

  protected onDigitFocus(index: number, event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected resendCode(): void {
    const value = this.accountForm.getRawValue();
    this.emailOtpDigits.set(['', '', '', '', '', '']);
    this.emailOtpError.set(null);

    this.isBusy.set(true);
    this.authApi
      .register({
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        phoneNumber: this.getAccountE164Phone(),
        password: value.password,
        roles: value.selectedRoles,
      })
      .pipe(finalize(() => this.isBusy.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resendSent.set(true);
          if (this.resendTimer) clearTimeout(this.resendTimer);
          this.resendTimer = setTimeout(() => {
            this.resendSent.set(false);
            this.cdr.markForCheck();
          }, 4000);
          document.getElementById('otp-digit-0')?.focus();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  protected verifyPhone(): void {
    const otp = this.verifyForm.controls.smsOtp.value.trim();
    if (otp.length < 6) {
      this.verifyForm.controls.smsOtp.setErrors({ otpInvalid: true });
      this.verifyForm.controls.smsOtp.markAsTouched();
      return;
    }
    clearApiError(this.verifyForm.controls.smsOtp);

    this.isBusy.set(true);
    this.authApi
      .verifyPhone({ otpCode: otp })
      .pipe(finalize(() => this.isBusy.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reg.setPhoneVerified(true);
          this.persistDraft(this.stage());
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          logRegistrationError('verifyPhone', err);
          const msg = mapRegistrationErrorToMessage(err, (k) => this.t(k));
          this.verifyForm.controls.smsOtp.setErrors({ api: msg });
          this.verifyForm.controls.smsOtp.markAsTouched();
          this.cdr.markForCheck();
        },
      });
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

  protected categoryLabel(category: WorkerCategory): string {
    return this.t(this.categoryLabelKey[category]);
  }

  protected onPhoneLocalInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = sanitizePhoneLocalInput(input.value);
    if (digits !== this.accountForm.controls.phoneLocalNumber.value) {
      this.accountForm.controls.phoneLocalNumber.setValue(digits);
    }
  }

  protected getAccountE164Phone(): string {
    return buildE164Phone(
      this.accountForm.controls.phoneDialCode.value,
      this.accountForm.controls.phoneLocalNumber.value,
    );
  }

  private syncPhoneNumberFromParts(): void {
    const e164 = this.getAccountE164Phone();
    const control = this.accountForm.controls.phoneNumber;
    if (control.value === e164) return;
    control.setValue(e164, { emitEvent: true });
    control.updateValueAndValidity({ emitEvent: true });
  }

  private applyPhonePartsFromE164(e164: string): void {
    const parsed = parseE164Phone(e164);
    if (parsed) {
      this.accountForm.patchValue({
        phoneDialCode: parsed.dialCode,
        phoneLocalNumber: parsed.localNumber,
      });
    } else if (e164.trim()) {
      this.accountForm.controls.phoneNumber.setValue(e164.trim());
    }
    this.syncPhoneNumberFromParts();
  }

  private locationCountryLabel(code: string): string {
    const normalized = code.trim().toUpperCase();
    const match = SUPPORTED_COUNTRY_OPTIONS.find((item) => item.code === normalized);
    return match ? this.t(match.labelKey) : normalized;
  }

  private maskDocumentNumber(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length <= 4) return '••••';
    return `•••• ${trimmed.slice(-4)}`;
  }

  protected isCategorySelected(category: WorkerCategory): boolean {
    return this.workerProfileForm.controls.categories.value.includes(category);
  }

  protected onWorkerCategoryPick(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value as WorkerCategory;
    if (!value) return;

    const control = this.workerProfileForm.controls.categories;
    const current = new Set(control.value);
    if (!current.has(value)) {
      current.add(value);
      control.setValue([...current]);
      control.markAsTouched();
    }

    select.value = '';
    this.cdr.markForCheck();
  }

  protected removeCategory(category: WorkerCategory): void {
    const control = this.workerProfileForm.controls.categories;
    control.setValue(control.value.filter((item) => item !== category));
    control.markAsTouched();
    this.cdr.markForCheck();
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
        phoneNumber: this.getAccountE164Phone(),
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
    if (stage === 'VERIFY') {
      this.emailOtpDigits.set(['', '', '', '', '', '']);
      this.emailOtpError.set(null);
      this.reg.setStage('ACCOUNT');
    } else if (stage === 'LOCATION') this.reg.setStage('VERIFY');
    else if (stage === 'ROLE_PROFILE') this.reg.setStage('LOCATION');
    else if (stage === 'PERSONAL_INFO') this.reg.setStage('ROLE_PROFILE');
  }
}

