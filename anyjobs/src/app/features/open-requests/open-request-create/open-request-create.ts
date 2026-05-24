import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import 'driver.js/dist/driver.css';

import { ModalComponent } from '../../../components/modal/modal';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { LocationGeographyService } from '../../../shared/location/location-geography.service';
import { SUPPORTED_COUNTRY_OPTIONS } from '../../auth/registration/registration.constants';
import { budgetCurrencyForCountry, formatOpenRequestBudgetLabel } from '../open-request-budget.utils';
import { buildOpenRequestLocationLabel } from '../open-request-location.utils';
import {
  WORK_CONDITION_FIELD_DEFS,
  WORK_CONDITIONS_ADDITIONAL_INSTRUCTIONS_MAX_LENGTH,
  buildWorkConditionsFromForm,
  type WorkConditionEnumKey,
} from '../open-request-work-conditions.constants';
import { MAX_OPEN_REQUEST_UPLOAD_FILES } from '../open-requests-multipart';
import { CreateOpenRequestInput } from '../open-requests.models';
import { OpenRequestsService } from '../open-requests.service';
import { startPublishRequestTour } from '../publish-request-tour';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
/** Tipos MIME aceptados al publicar imágenes (alineados con uso típico en API). */
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES_PER_FILE = 10 * 1024 * 1024;
const MAX_NEIGHBORHOOD_LENGTH = 120;
const SUCCESS_REDIRECT_DELAY_MS = 1500;

const COUNTRY_LABELS: Record<string, string> = {
  CO: 'Colombia',
  AR: 'Argentina',
};

function fileLooksLikeAcceptedImage(f: File): boolean {
  const t = f.type.toLowerCase();
  if (ACCEPTED_IMAGE_TYPES.has(t)) return true;
  if (t.length > 0) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(f.name.trim());
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Pantalla autenticada para que un usuario publique una nueva solicitud abierta
 * consumiendo `POST /open-requests` vía `OpenRequestsService.createOpenRequest`.
 */
@Component({
  selector: 'app-open-request-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ModalComponent],
  templateUrl: './open-request-create.html',
  styleUrl: './open-request-create.scss',
})
export class OpenRequestCreate {
  @ViewChild('imageFileInput') private imageFileInput?: ElementRef<HTMLInputElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly openRequests = inject(OpenRequestsService);
  private readonly auth = inject(AuthSessionService);
  private readonly locationGeography = inject(LocationGeographyService);
  protected readonly authVm = this.auth.vm;

  protected readonly countryOptions = SUPPORTED_COUNTRY_OPTIONS.map((c) => ({
    code: c.code,
    label: COUNTRY_LABELS[c.code] ?? c.code,
  }));

  private readonly formStatusTick = signal(0);
  private tourHandle: { destroy: () => void } | null = null;

  protected readonly state = signal<SubmitState>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly missingFields = signal<readonly string[]>([]);
  protected readonly isSuccessOpen = signal(false);

  private readonly fieldLabels: Record<string, string> = {
    title: 'Título',
    excerpt: 'Resumen corto',
    description: 'Descripción',
    tagsInput: 'Etiquetas',
    countryCode: 'País',
    division: 'Departamento / provincia',
    municipality: 'Municipio / ciudad',
    neighborhood: 'Barrio',
    budgetLabel: 'Presupuesto',
  };

  protected readonly form = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    excerpt: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(160),
    ]),
    description: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(20),
    ]),
    tagsInput: this.fb.nonNullable.control('', [tagsValidator()]),
    countryCode: this.fb.nonNullable.control('', [Validators.required]),
    division: this.fb.nonNullable.control('', [Validators.required]),
    municipality: this.fb.nonNullable.control('', [Validators.required]),
    neighborhood: this.fb.nonNullable.control('', [
      Validators.maxLength(MAX_NEIGHBORHOOD_LENGTH),
      noUuidValidator(),
    ]),
    budgetLabel: this.fb.nonNullable.control(
      { value: '', disabled: true },
      [Validators.required],
    ),
    workConditions: this.fb.nonNullable.group({
      ownToolsRequired: this.fb.nonNullable.control(''),
      workerMustTravel: this.fb.nonNullable.control(''),
      requesterProvidesMaterials: this.fb.nonNullable.control(''),
      requesterProvidesTools: this.fb.nonNullable.control(''),
      priorExperienceRequired: this.fb.nonNullable.control(''),
      scheduleFlexible: this.fb.nonNullable.control(''),
      priorVisitRequired: this.fb.nonNullable.control(''),
      easyAccessOrInstructions: this.fb.nonNullable.control(''),
      additionalInstructions: this.fb.nonNullable.control('', [
        Validators.maxLength(WORK_CONDITIONS_ADDITIONAL_INSTRUCTIONS_MAX_LENGTH),
      ]),
    }),
  });

  protected readonly workConditionFields = WORK_CONDITION_FIELD_DEFS;
  protected readonly additionalInstructionsMaxLength = WORK_CONDITIONS_ADDITIONAL_INSTRUCTIONS_MAX_LENGTH;

  protected readonly divisionOptions = computed(() => {
    this.formStatusTick();
    this.locationGeography.divisionsLoaded();
    const code = this.form.controls.countryCode.value;
    return code ? [...this.locationGeography.divisions(code)] : [];
  });

  protected readonly municipalityOptions = computed(() => {
    this.formStatusTick();
    this.locationGeography.municipalitiesLoaded();
    const code = this.form.controls.countryCode.value;
    const division = this.form.controls.division.value;
    return code && division ? [...this.locationGeography.municipalities(code, division)] : [];
  });

  protected readonly budgetCurrency = computed(() => {
    this.formStatusTick();
    return budgetCurrencyForCountry(this.form.controls.countryCode.value);
  });

  protected readonly isSubmitDisabled = computed(() => this.state() === 'submitting');

  protected readonly tagsPreview = signal<readonly string[]>([]);

  /** Archivos locales elegidos por el usuario (multipart `files`). */
  protected readonly selectedImageFiles = signal<readonly File[]>([]);

  protected readonly imageSelectionError = signal<string | null>(null);

  protected readonly maxImageFiles = MAX_OPEN_REQUEST_UPLOAD_FILES;

  constructor() {
    this.locationGeography
      .ensureCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formStatusTick.update((n) => n + 1));

    this.form.controls.tagsInput.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((raw) => this.tagsPreview.set(parseTags(raw)));

    this.form.controls.countryCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((countryCode) => {
        this.form.controls.division.setValue('');
        this.form.controls.municipality.setValue('');
        this.form.controls.division.markAsUntouched();
        this.form.controls.municipality.markAsUntouched();
        if (countryCode) {
          this.form.controls.budgetLabel.enable({ emitEvent: false });
          this.locationGeography
            .loadDivisionsForCountry(countryCode)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.formStatusTick.update((n) => n + 1));
        } else {
          this.form.controls.budgetLabel.disable({ emitEvent: false });
          this.form.controls.budgetLabel.setValue('');
        }
        this.formStatusTick.update((n) => n + 1);
      });

    this.form.controls.division.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((division) => {
        this.form.controls.municipality.setValue('');
        this.form.controls.municipality.markAsUntouched();
        const countryCode = this.form.controls.countryCode.value;
        if (countryCode && division) {
          this.locationGeography
            .loadMunicipalitiesForDivision(countryCode, division)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.formStatusTick.update((n) => n + 1));
        }
      });

    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.missingFields().length === 0) return;
        if (
          this.form.valid &&
          !this.imageSelectionError() &&
          this.hasRequiredMultimedia() &&
          this.locationLabelError() === null
        ) {
          this.state.set('idle');
          this.errorMessage.set(null);
          this.missingFields.set([]);
        }
      });

    effect((onCleanup) => {
      if (!this.isSuccessOpen()) return;
      const timeoutId = window.setTimeout(() => this.closeSuccess(), SUCCESS_REDIRECT_DELAY_MS);
      onCleanup(() => window.clearTimeout(timeoutId));
    });

    this.destroyRef.onDestroy(() => this.tourHandle?.destroy());
  }

  /** Aceptado por el input type=file (evita tipos arbitrarios antes de subir). */
  protected readonly imageFileAccept = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';

  protected startHelpTour(): void {
    this.tourHandle?.destroy();
    this.tourHandle = startPublishRequestTour();
  }

  protected selectWorkCondition(key: WorkConditionEnumKey, value: string): void {
    const ctrl = this.form.controls.workConditions.controls[key];
    ctrl.setValue(ctrl.value === value ? '' : value);
    ctrl.markAsTouched();
  }

  protected isWorkConditionSelected(key: WorkConditionEnumKey, value: string): boolean {
    return this.form.controls.workConditions.controls[key].value === value;
  }

  protected onImageFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.length ? Array.from(input.files) : [];
    input.value = '';

    if (picked.length === 0) {
      return;
    }

    const existing = this.selectedImageFiles();
    const room = MAX_OPEN_REQUEST_UPLOAD_FILES - existing.length;

    if (room <= 0) {
      this.imageSelectionError.set(
        `Solo puedes subir hasta ${MAX_OPEN_REQUEST_UPLOAD_FILES} imágenes. Quita alguna para añadir más.`,
      );
      return;
    }

    const batch = picked.slice(0, room);

    const tooBig = batch.find((f) => f.size > MAX_IMAGE_BYTES_PER_FILE);
    if (tooBig) {
      this.imageSelectionError.set('Cada imagen debe pesar menos de 10 MB.');
      return;
    }

    const badType = batch.find((f) => !fileLooksLikeAcceptedImage(f));
    if (badType) {
      this.imageSelectionError.set('Solo JPG, PNG, WebP o GIF.');
      return;
    }

    const isSameFile = (a: File, b: File): boolean =>
      a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

    const deduped: File[] = [];
    for (const f of batch) {
      if (existing.some((e) => isSameFile(e, f))) continue;
      if (deduped.some((g) => isSameFile(g, f))) continue;
      deduped.push(f);
    }

    if (deduped.length === 0) {
      this.imageSelectionError.set('Esas imágenes ya estaban seleccionadas.');
      return;
    }

    this.imageSelectionError.set(null);
    this.selectedImageFiles.set([...existing, ...deduped]);

    if (this.state() === 'error' && this.missingFields().length === 0) {
      this.state.set('idle');
      this.errorMessage.set(null);
    }
  }

  protected removeImageAt(index: number): void {
    this.selectedImageFiles.update((curr) => curr.filter((_, i) => i !== index));
    this.imageSelectionError.set(null);
  }

  protected clearAllImages(): void {
    this.selectedImageFiles.set([]);
    this.imageSelectionError.set(null);
    const el = this.imageFileInput?.nativeElement;
    if (el) el.value = '';
  }

  protected submit(): void {
    if (!this.authVm().isLoggedIn) {
      this.openLogin();
      return;
    }

    if (this.imageSelectionError()) {
      this.state.set('error');
      this.errorMessage.set(this.imageSelectionError());
      return;
    }

    this.form.markAllAsTouched();
    const locationError = this.locationLabelError();
    const missingMultimedia = !this.hasRequiredMultimedia();
    if (missingMultimedia) {
      this.imageSelectionError.set('Debes adjuntar al menos un archivo de contenido multimedia.');
    }
    if (!this.form.valid || locationError || missingMultimedia) {
      this.reportInvalidForm(locationError, missingMultimedia);
      return;
    }

    this.missingFields.set([]);

    const raw = this.form.getRawValue();
    const locationLabel = buildOpenRequestLocationLabel({
      countryCode: raw.countryCode,
      division: raw.division,
      municipality: raw.municipality,
      neighborhood: raw.neighborhood,
    });

    if (!locationLabel) {
      this.reportInvalidForm('No se pudo construir la ubicación. Revisa país, departamento y municipio.');
      return;
    }

    const files = this.selectedImageFiles();
    const workConditions = buildWorkConditionsFromForm(this.form.controls.workConditions.getRawValue());

    const input: CreateOpenRequestInput = {
      title: raw.title,
      excerpt: raw.excerpt,
      description: raw.description,
      tags: parseTags(raw.tagsInput),
      locationLabel,
      budgetLabel: formatOpenRequestBudgetLabel(raw.budgetLabel, locationLabel) || raw.budgetLabel,
      imageFiles: files,
      ...(workConditions ? { workConditions } : {}),
    };

    this.state.set('submitting');
    this.errorMessage.set(null);

    this.openRequests
      .createOpenRequest(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.state() === 'submitting') this.state.set('idle');
        }),
      )
      .subscribe({
        next: (created) => {
          this.state.set('success');
          this.createdId = created.id;
          this.isSuccessOpen.set(true);
        },
        error: (err: unknown) => {
          this.state.set('error');
          this.handleError(err);
        },
      });
  }

  private createdId: string | null = null;

  protected retry(): void {
    if (this.state() === 'submitting') return;
    this.submit();
  }

  protected openLogin(): void {
    void this.router.navigate([], {
      queryParams: { login: 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected goBack(): void {
    void this.router.navigate(['/solicitudes']);
  }

  protected closeSuccess(): void {
    this.isSuccessOpen.set(false);
    if (this.createdId) {
      void this.router.navigate(['/solicitudes', this.createdId]);
    }
  }

  protected isSessionExpiredError(): boolean {
    return this.errorMessage() === 'Tu sesión expiró, vuelve a iniciar sesión';
  }

  private hasRequiredMultimedia(): boolean {
    return this.selectedImageFiles().length > 0;
  }

  private locationLabelError(): string | null {
    const raw = this.form.getRawValue();
    if (!raw.countryCode || !raw.division || !raw.municipality) return null;
    const label = buildOpenRequestLocationLabel({
      countryCode: raw.countryCode,
      division: raw.division,
      municipality: raw.municipality,
      neighborhood: raw.neighborhood,
    });
    if (!label) return 'Revisa los campos de ubicación.';
    if (UUID_PATTERN.test(label)) return 'La ubicación no puede contener identificadores técnicos.';
    return null;
  }

  private reportInvalidForm(
    locationError: string | null = null,
    missingMultimedia = false,
  ): void {
    const missing = this.collectInvalidFieldLabels();
    if (locationError && !missing.includes('Ubicación')) {
      missing.push('Ubicación');
    }
    if (missingMultimedia && !missing.includes('Contenido multimedia')) {
      missing.push('Contenido multimedia');
    }
    this.missingFields.set(missing);
    this.state.set('error');
    this.errorMessage.set(
      locationError ??
        (missing.length === 1
          ? `Falta completar o corregir 1 campo: ${missing[0]}.`
          : `Faltan ${missing.length} campos por completar o corregir.`),
    );
    this.focusFirstInvalidControl();
  }

  private collectInvalidFieldLabels(): string[] {
    const labels: string[] = [];
    for (const [name, ctrl] of Object.entries(this.form.controls)) {
      if (name === 'workConditions') continue;
      if (!ctrl.invalid) continue;
      const label = this.fieldLabels[name] ?? name;
      if (!labels.includes(label)) labels.push(label);
    }
    const wc = this.form.controls.workConditions;
    if (wc.controls.additionalInstructions.invalid && !labels.includes('Instrucciones adicionales')) {
      labels.push('Instrucciones adicionales');
    }
    return labels;
  }

  private focusFirstInvalidControl(): void {
    if (typeof window === 'undefined') return;
    window.setTimeout(() => {
      const el = document.querySelector(
        '.createRequest [aria-invalid="true"]',
      ) as HTMLElement | null;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  private handleError(err: unknown): void {
    this.missingFields.set([]);
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    const apiMessage =
      err instanceof HttpErrorResponse ? readApiMessage(err.error) : undefined;

    if (status === 401) {
      this.errorMessage.set('Tu sesión expiró, vuelve a iniciar sesión');
      return;
    }

    if (status === 403) {
      this.errorMessage.set('Tu cuenta no tiene permiso para publicar solicitudes');
      return;
    }

    if (status >= 400 && status < 500 && apiMessage) {
      this.errorMessage.set(apiMessage);
      return;
    }

    this.errorMessage.set('No se pudo publicar tu solicitud, intenta de nuevo');
  }
}

function readApiMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const msg = (body as Record<string, unknown>)['message'];
  return typeof msg === 'string' && msg.trim().length > 0 ? msg.trim() : undefined;
}

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const piece of raw.split(',')) {
    const tag = piece.trim();
    if (tag.length === 0) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

function tagsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value : '';
    return parseTags(value).length === 0 ? { tagsRequired: true } : null;
  };
}

function noUuidValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value : '';
    if (!value.trim()) return null;
    return UUID_PATTERN.test(value) ? { uuidNotAllowed: true } : null;
  };
}
