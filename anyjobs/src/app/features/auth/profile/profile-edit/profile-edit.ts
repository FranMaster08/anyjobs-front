import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../components/modal/modal';
import { UserApi } from '../../../../shared/api/user.api';
import type { UpdateProfileRequest } from '../../../../shared/api/user.models';
import type { UserPrivateProfileDto } from '../../../../shared/api/user-profile.models';
import { LocationGeographyService } from '../../../../shared/location/location-geography.service';
import {
  PAYMENT_METHOD_LABEL_KEY,
  PAYMENT_METHOD_OPTIONS,
  SUPPORTED_COUNTRY_OPTIONS,
  WORKER_CATEGORY_LABEL_KEY,
  WORKER_CATEGORY_OPTIONS,
  type PaymentMethod,
  type WorkerCategory,
} from '../../registration/registration.constants';
import {
  cityInCountryValidator,
  municipalityInDivisionValidator,
} from '../../registration/registration.validators';
import type { UserRole } from '../../registration/registration.models';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { startProfileEditTour } from './profile-edit-tour';
import 'driver.js/dist/driver.css';

@Component({
  selector: 'app-profile-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './profile-edit.html',
  styleUrl: './profile-edit.scss',
})
export class ProfileEditComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly userApi = inject(UserApi);
  private readonly locationGeography = inject(LocationGeographyService);
  private readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly profile = input<UserPrivateProfileDto | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly validationAttempted = signal(false);

  private tourHandle: { destroy: () => void } | null = null;

  protected readonly countryOptions = SUPPORTED_COUNTRY_OPTIONS;
  protected readonly paymentOptions: readonly PaymentMethod[] = PAYMENT_METHOD_OPTIONS;
  protected readonly paymentLabelKey = PAYMENT_METHOD_LABEL_KEY;
  protected readonly categoryOptions: readonly WorkerCategory[] = WORKER_CATEGORY_OPTIONS;
  protected readonly categoryLabelKey = WORKER_CATEGORY_LABEL_KEY;

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.minLength(2), Validators.maxLength(200)]],
    countryCode: ['', Validators.required],
    city: ['', Validators.required],
    municipality: ['', Validators.required],
    area: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    coverageRadiusKm: [''],
    headline: ['', Validators.maxLength(200)],
    bio: ['', Validators.maxLength(2000)],
    preferredPaymentMethod: ['' as PaymentMethod | ''],
    categories: [[] as string[]],
  });

  protected readonly roles = computed(() => (this.profile()?.roles ?? []) as UserRole[]);
  protected readonly isWorker = computed(() => this.roles().includes('WORKER'));
  protected readonly isClient = computed(() => this.roles().includes('CLIENT'));

  protected readonly lockedCountryLabel = computed(() => {
    const code = this.lockedCountryCode();
    if (!code) return '—';
    const match = this.countryOptions.find((c) => c.code === code);
    return match ? this.t(match.labelKey) : code;
  });

  /** País fijo del perfil (el control del formulario está deshabilitado). */
  protected readonly lockedCountryCode = computed(() => {
    const fromProfile = this.profile()?.countryCode?.trim() ?? '';
    if (fromProfile) return fromProfile.toUpperCase();
    const fromForm = this.form.controls.countryCode.getRawValue().trim();
    return fromForm ? fromForm.toUpperCase() : '';
  });

  private readonly locationOptionsTick = signal(0);

  protected readonly locationCityOptions = computed(() => {
    this.locationOptionsTick();
    this.locationGeography.divisionsLoaded();
    const code = this.lockedCountryCode();
    return code ? [...this.locationGeography.divisions(code)] : [];
  });

  protected readonly locationMunicipalityOptions = computed(() => {
    this.locationOptionsTick();
    this.locationGeography.municipalitiesLoaded();
    const code = this.lockedCountryCode();
    const division = this.form.controls.city.value;
    return code && division ? [...this.locationGeography.municipalities(code, division)] : [];
  });

  protected readonly t = (key: string) => this.i18n.t(key);

  constructor() {
    this.destroyRef.onDestroy(() => this.tourHandle?.destroy());

    this.form.controls.city.addValidators(
      cityInCountryValidator(() => this.lockedCountryCode()),
    );
    this.form.controls.municipality.addValidators(
      municipalityInDivisionValidator(
        () => this.lockedCountryCode(),
        () => this.form.controls.city.value,
      ),
    );

    this.form.controls.city.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((city) => {
      this.form.controls.municipality.setValue('');
      this.form.controls.area.setValue('');
      this.bumpLocationOptions();
      const countryCode = this.lockedCountryCode();
      if (countryCode && city) {
        this.locationGeography
          .loadMunicipalitiesForDivision(countryCode, city)
          .subscribe(() => this.bumpLocationOptions());
      }
    });

    effect(() => {
      if (!this.open()) {
        this.tourHandle?.destroy();
        this.tourHandle = null;
        return;
      }
      const p = this.profile();
      if (!p) return;
      this.validationAttempted.set(false);
      this.saveError.set(null);
      this.form.patchValue({
        displayName: p.displayName ?? '',
        countryCode: p.countryCode ?? '',
        city: p.city ?? '',
        municipality: p.municipality ?? '',
        area: p.area ?? '',
        coverageRadiusKm: p.coverageRadiusKm != null ? String(p.coverageRadiusKm) : '',
        headline: p.workerHeadline ?? '',
        bio: p.workerBio ?? '',
        preferredPaymentMethod: (p.preferredPaymentMethod ?? '') as PaymentMethod | '',
        categories: [...(p.workerCategories ?? [])],
      });
      this.form.controls.countryCode.disable({ emitEvent: false });
      this.bumpLocationOptions();
      const code = p.countryCode?.trim().toUpperCase() ?? '';
      this.locationGeography.ensureCatalog().subscribe(() => {
        if (!code) return;
        this.locationGeography.loadDivisionsForCountry(code).subscribe(() => {
          this.bumpLocationOptions();
          if (p.city) {
            this.locationGeography
              .loadMunicipalitiesForDivision(code, p.city)
              .subscribe(() => this.bumpLocationOptions());
          }
        });
      });
    });
  }

  private bumpLocationOptions(): void {
    this.locationOptionsTick.update((n) => n + 1);
  }

  protected showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return this.validationAttempted() && control.invalid;
  }

  protected toggleCategory(category: WorkerCategory): void {
    const current = [...this.form.controls.categories.value];
    const idx = current.indexOf(category);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(category);
    this.form.controls.categories.setValue(current);
  }

  protected isCategorySelected(category: WorkerCategory): boolean {
    return this.form.controls.categories.value.includes(category);
  }

  protected startHelpTour(event: Event): void {
    event.stopPropagation();
    this.tourHandle?.destroy();
    this.tourHandle = startProfileEditTour({
      isWorker: this.isWorker(),
      isClient: this.isClient(),
    });
  }

  protected onCancel(): void {
    this.tourHandle?.destroy();
    this.tourHandle = null;
    this.closed.emit();
  }

  protected onSubmit(): void {
    this.validationAttempted.set(true);
    this.saveError.set(null);

    if (this.isWorker() && this.form.controls.categories.value.length < 1) {
      this.saveError.set('Selecciona al menos una categoría de servicio.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const countryCode = this.lockedCountryCode();
    const payload: UpdateProfileRequest = {
      displayName: raw.displayName.trim().length > 0 ? raw.displayName.trim() : null,
      countryCode,
      city: raw.city,
      municipality: raw.municipality,
      area: raw.area,
    };

    if (this.isWorker()) {
      payload.workerCategories = raw.categories;
      payload.headline = raw.headline.trim() || undefined;
      payload.bio = raw.bio.trim() || undefined;
      const radius = raw.coverageRadiusKm.trim();
      if (radius.length > 0) {
        const n = Number(radius);
        if (!Number.isNaN(n) && n >= 0) payload.coverageRadiusKm = n;
      }
    }

    if (this.isClient() && raw.preferredPaymentMethod) {
      payload.preferredPaymentMethod = raw.preferredPaymentMethod;
    }

    this.isSaving.set(true);
    this.userApi
      .updateProfile(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.saved.emit(),
        error: (err: unknown) => {
          const msg =
            err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
              ? err.error.message
              : 'No pudimos guardar los cambios. Inténtalo de nuevo.';
          this.saveError.set(msg);
        },
      });
  }
}
