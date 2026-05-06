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

import { ModalComponent } from '../../../components/modal/modal';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { MAX_OPEN_REQUEST_UPLOAD_FILES } from '../open-requests-multipart';
import { CreateOpenRequestInput } from '../open-requests.models';
import { OpenRequestsService } from '../open-requests.service';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
/** Tipos MIME aceptados al publicar imágenes (alineados con uso típico en API). */
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES_PER_FILE = 10 * 1024 * 1024;

function fileLooksLikeAcceptedImage(f: File): boolean {
  const t = f.type.toLowerCase();
  if (ACCEPTED_IMAGE_TYPES.has(t)) return true;
  if (t.length > 0) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(f.name.trim());
}
const SUCCESS_REDIRECT_DELAY_MS = 1500;

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
  });

  protected readonly isSubmitDisabled = computed(() => this.state() === 'submitting');

  protected readonly tagsPreview = signal<readonly string[]>([]);

  /** Archivos locales elegidos por el usuario (multipart `files`). */
  protected readonly selectedImageFiles = signal<readonly File[]>([]);

  protected readonly imageSelectionError = signal<string | null>(null);

  protected readonly maxImageFiles = MAX_OPEN_REQUEST_UPLOAD_FILES;

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

    // Cuando el usuario corrige el form tras un error de validación local, limpiamos el banner.
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.missingFields().length === 0) return;
        if (this.form.valid && !this.imageSelectionError()) {
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

  /** Aceptado por el input type=file (evita tipos arbitrarios antes de subir). */
  protected readonly imageFileAccept = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';

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
    if (this.imageSelectionError()) {
      this.state.set('error');
      this.errorMessage.set(this.imageSelectionError());
      return;
    }

    this.form.markAllAsTouched();
    if (!this.form.valid) {
      this.reportInvalidForm();
      return;
    }

    this.missingFields.set([]);

    const raw = this.form.getRawValue();
    const files = this.selectedImageFiles();

    const input: CreateOpenRequestInput = {
      title: raw.title,
      excerpt: raw.excerpt,
      description: raw.description,
      tags: parseTags(raw.tagsInput),
      locationLabel: raw.locationLabel,
      budgetLabel: raw.budgetLabel,
      contactPhone: raw.contactPhone,
      contactEmail: raw.contactEmail,
      ...(files.length > 0 ? { imageFiles: files } : {}),
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
    const apiMessage =
      err instanceof HttpErrorResponse ? readApiMessage(err.error) : undefined;

    if (status === 401) {
      this.auth.clear();
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
    return UUID_PATTERN.test(value) ? { uuidNotAllowed: true } : null;
  };
}
