import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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

import { ModalComponent } from '../../../components/modal/modal';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { CreateOpenRequestInput } from '../open-requests.models';
import { OpenRequestsService } from '../open-requests.service';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const SUCCESS_REDIRECT_DELAY_MS = 1500;
const MAX_IMAGE_FILES = 6;
const MIN_IMAGE_FILES = 1;

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly openRequests = inject(OpenRequestsService);
  private readonly auth = inject(AuthSessionService);
  protected readonly authVm = this.auth.vm;

  protected readonly state = signal<SubmitState>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly missingFields = signal<readonly string[]>([]);
  protected readonly isSuccessOpen = signal(false);

  private readonly fieldLabels: Record<string, string> = {
    title: 'Título',
    excerpt: 'Resumen corto',
    description: 'Descripción',
    tagsInput: 'Etiquetas',
    locationLabel: 'Ubicación',
    budgetLabel: 'Presupuesto',
    contactPhone: 'Teléfono',
    contactEmail: 'Email',
    imageFiles: 'Imágenes',
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
    locationLabel: this.fb.nonNullable.control('', [
      Validators.required,
      noUuidValidator(),
    ]),
    budgetLabel: this.fb.nonNullable.control('', [Validators.required]),
    contactPhone: this.fb.nonNullable.control('', [Validators.required]),
    contactEmail: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
    ]),
    imageFiles: this.fb.nonNullable.control<readonly File[]>([], [imageFilesCountValidator()]),
  });

  protected readonly isSubmitDisabled = computed(() => this.state() === 'submitting');

  protected readonly tagsPreview = signal<readonly string[]>([]);
  protected readonly selectedImageFiles = signal<readonly File[]>([]);

  constructor() {
    const user = this.authVm().user;
    if (user?.email) {
      this.form.controls.contactEmail.setValue(user.email);
    }
    if (user?.phoneNumber) {
      this.form.controls.contactPhone.setValue(user.phoneNumber);
    }

    this.form.controls.tagsInput.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((raw) => this.tagsPreview.set(parseTags(raw)));
    this.form.controls.imageFiles.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((files) => this.selectedImageFiles.set(files));

    // Cuando el usuario corrige el form tras un error de validación local, limpiamos el banner.
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.missingFields().length === 0) return;
        if (this.form.valid) {
          this.state.set('idle');
          this.errorMessage.set(null);
          this.missingFields.set([]);
        }
      });

    // Auto-cierra el modal de éxito y navega cuando la creación finaliza.
    effect((onCleanup) => {
      if (!this.isSuccessOpen()) return;
      const timeoutId = window.setTimeout(() => this.closeSuccess(), SUCCESS_REDIRECT_DELAY_MS);
      onCleanup(() => window.clearTimeout(timeoutId));
    });
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      this.reportInvalidForm();
      return;
    }

    this.missingFields.set([]);

    const raw = this.form.getRawValue();
    const input: CreateOpenRequestInput = {
      title: raw.title,
      excerpt: raw.excerpt,
      description: raw.description,
      tags: parseTags(raw.tagsInput),
      locationLabel: raw.locationLabel,
      budgetLabel: raw.budgetLabel,
      contactPhone: raw.contactPhone,
      contactEmail: raw.contactEmail,
      imageFiles: raw.imageFiles,
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

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    const current = [...this.form.controls.imageFiles.value];
    const dedupedCurrent = dedupeFiles(current);
    const next = dedupeFiles([...dedupedCurrent, ...files]).slice(0, MAX_IMAGE_FILES);
    this.form.controls.imageFiles.setValue(next);
    this.form.controls.imageFiles.markAsTouched();
    if (input) input.value = '';
  }

  protected removeSelectedFile(index: number): void {
    const current = [...this.form.controls.imageFiles.value];
    if (index < 0 || index >= current.length) return;
    current.splice(index, 1);
    this.form.controls.imageFiles.setValue(current);
    this.form.controls.imageFiles.markAsTouched();
  }

  protected isSessionExpiredError(): boolean {
    return this.errorMessage() === 'Tu sesión expiró, vuelve a iniciar sesión';
  }

  private reportInvalidForm(): void {
    const missing = this.collectInvalidFieldLabels();
    this.missingFields.set(missing);
    this.state.set('error');
    this.errorMessage.set(
      missing.length === 1
        ? `Falta completar o corregir 1 campo: ${missing[0]}.`
        : `Faltan ${missing.length} campos por completar o corregir.`,
    );
    this.focusFirstInvalidControl();
  }

  private collectInvalidFieldLabels(): string[] {
    const labels: string[] = [];
    for (const [name, ctrl] of Object.entries(this.form.controls)) {
      if (!ctrl.invalid) continue;
      const label = this.fieldLabels[name] ?? name;
      if (!labels.includes(label)) labels.push(label);
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

    if (status === 401) {
      this.auth.clear();
      this.errorMessage.set('Tu sesión expiró, vuelve a iniciar sesión');
      return;
    }

    if (status === 403) {
      this.errorMessage.set('Tu cuenta no tiene permiso para publicar solicitudes');
      return;
    }

    this.errorMessage.set('No se pudo publicar tu solicitud, intenta de nuevo');
  }
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
    return UUID_PATTERN.test(value) ? { uuidNotAllowed: true } : null;
  };
}

function imageFilesCountValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = Array.isArray(control.value) ? (control.value as readonly File[]) : [];
    if (value.length < MIN_IMAGE_FILES) return { minImages: true };
    if (value.length > MAX_IMAGE_FILES) return { maxImages: true };
    return null;
  };
}

function dedupeFiles(files: readonly File[]): File[] {
  const seen = new Set<string>();
  const out: File[] = [];
  for (const file of files) {
    const key = `${file.name}::${file.size}::${file.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(file);
  }
  return out;
}
