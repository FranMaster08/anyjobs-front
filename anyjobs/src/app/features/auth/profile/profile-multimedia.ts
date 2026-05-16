import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, of, Subscription, switchMap } from 'rxjs';

import { ModalComponent } from '../../../components/modal/modal';
import type { UserReelDto } from '../../../shared/api/user-media.api';
import { UserMediaApi } from '../../../shared/api/user-media.api';
import {
  formatFileSizeMb,
  isUploadFileTooLarge,
  resolveUploadMimeType,
  USER_MEDIA_MAX_BYTES,
} from '../../../shared/media/user-media-upload.utils';

@Component({
  selector: 'app-profile-multimedia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ModalComponent],
  templateUrl: './profile-multimedia.html',
  styleUrl: './profile-multimedia.scss',
})
export class ProfileMultimediaComponent {
  private readonly mediaApi = inject(UserMediaApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly profileUserId = input.required<string>();
  readonly isOwnProfile = input(false);
  readonly tabActive = input(false);

  readonly reelsChanged = output<void>();

  protected readonly reels = signal<UserReelDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly loaded = signal(false);
  /** Error al subir un archivo (no confundir con la carga del listado). */
  protected readonly uploadError = signal<string | null>(null);
  /** Error real de red/servidor al listar; vacío ≠ error. */
  protected readonly loadError = signal<string | null>(null);
  protected readonly uploadBusy = signal(false);
  protected readonly playerReel = signal<UserReelDto | null>(null);
  protected readonly reelPendingDelete = signal<UserReelDto | null>(null);
  protected readonly deleteBusy = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  private loadSub: Subscription | null = null;

  constructor() {
    effect(() => {
      const active = this.tabActive();
      const userId = this.profileUserId();
      if (!active || !userId) return;

      this.loadReels();
    });

    this.destroyRef.onDestroy(() => this.loadSub?.unsubscribe());
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.isOwnProfile()) return;

    const mime = resolveUploadMimeType(file);
    if (!mime) {
      this.uploadError.set(
        `Formato no permitido (${file.type || 'tipo desconocido'}). Usa MP4, WebM, MOV o imagen JPG/PNG/WebP.`,
      );
      return;
    }
    if (isUploadFileTooLarge(file.size)) {
      this.uploadError.set(
        `El archivo pesa ${formatFileSizeMb(file.size)} y el máximo es ${formatFileSizeMb(USER_MEDIA_MAX_BYTES)}. ` +
          'El explorador a veces muestra un tamaño menor; revisa las propiedades del archivo.',
      );
      return;
    }

    const uploadFile =
      mime !== file.type ? new File([file], file.name, { type: mime, lastModified: file.lastModified }) : file;

    this.uploadBusy.set(true);
    this.uploadError.set(null);
    this.mediaApi
      .uploadAsset(uploadFile)
      .pipe(
        switchMap((asset) =>
          this.mediaApi.createReel(asset.id).pipe(
            switchMap((reel) => this.mediaApi.publishReel(reel.id)),
          ),
        ),
        catchError((err: unknown) => {
          this.uploadError.set(this.resolveUploadErrorMessage(err));
          return of(null);
        }),
        finalize(() => this.uploadBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((published) => {
        if (published) {
          this.loadReels();
          this.reelsChanged.emit();
        }
      });
  }

  protected openPlayer(reel: UserReelDto): void {
    this.playerReel.set(reel);
  }

  protected closePlayer(): void {
    this.playerReel.set(null);
  }

  protected requestDelete(reel: UserReelDto, event: Event): void {
    event.stopPropagation();
    this.deleteError.set(null);
    this.reelPendingDelete.set(reel);
  }

  protected cancelDelete(): void {
    if (this.deleteBusy()) return;
    this.reelPendingDelete.set(null);
    this.deleteError.set(null);
  }

  protected confirmDelete(): void {
    const reel = this.reelPendingDelete();
    if (!reel || this.deleteBusy()) return;

    this.deleteBusy.set(true);
    this.deleteError.set(null);

    this.mediaApi
      .deleteReel(reel.id)
      .pipe(
        catchError((err: unknown) => {
          this.deleteError.set(this.resolveDeleteErrorMessage(err));
          return EMPTY;
        }),
        finalize(() => this.deleteBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const id = reel.id;
        this.reels.update((items) => items.filter((r) => r.id !== id));
        if (this.playerReel()?.id === id) {
          this.closePlayer();
        }
        this.reelPendingDelete.set(null);
        this.reelsChanged.emit();
      });
  }

  protected isVideo(reel: UserReelDto): boolean {
    return reel.media?.mediaKind === 'video';
  }

  protected statusLabel(reel: UserReelDto): string {
    if (reel.distributionStatus === 'draft') return 'Borrador';
    if (reel.moderationStatus === 'pending') return 'Pendiente';
    return 'Publicado';
  }

  private loadReels(): void {
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.loadError.set(null);
    this.loaded.set(false);

    const req = this.isOwnProfile()
      ? this.mediaApi.listMyReels()
      : this.mediaApi.listPublicReels(this.profileUserId());

    this.loadSub = req
      .pipe(
        catchError((err: unknown) => {
          this.loadError.set(this.resolveLoadErrorMessage(err));
          return of({ items: [] as UserReelDto[] });
        }),
        finalize(() => {
          this.loading.set(false);
          this.loaded.set(true);
        }),
      )
      .subscribe((res) => {
        const items = this.isOwnProfile()
          ? res.items
          : res.items.filter((r) => r.moderationStatus === 'approved' && r.distributionStatus !== 'draft');
        this.reels.set(items);
      });
  }

  private readApiErrorMessage(err: HttpErrorResponse): string | null {
    const body = err.error;
    if (typeof body?.message === 'string' && body.message.trim().length > 0) {
      return body.message.trim();
    }
    const details = body?.details;
    if (details && typeof details === 'object') {
      const raw = (details as { message?: unknown }).message;
      if (typeof raw === 'string') return raw;
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((m) => String(m)).join(' ');
      }
    }
    if (typeof body?.technicalMessage === 'string' && body.technicalMessage.includes('MIME')) {
      return 'Formato de video no reconocido. Prueba exportar a MP4.';
    }
    if (typeof body?.technicalMessage === 'string' && body.technicalMessage.includes('50 MB')) {
      return 'El servidor rechazó el archivo por tamaño (máx. 50 MB).';
    }
    return null;
  }

  private resolveUploadErrorMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) {
      return 'No se pudo completar la publicación del reel.';
    }
    if (err.status === 0) {
      return 'Sin conexión con el servidor. Si usas Docker, reinicia el contenedor del front tras actualizar el proxy.';
    }
    if (err.status === 401) {
      return 'Debes iniciar sesión para subir reels.';
    }
    if (err.status === 404) {
      return 'El servidor no encontró la ruta de subida. Reinicia el front (ng serve / docker compose) para aplicar el proxy.';
    }
    if (err.status === 400) {
      return this.readApiErrorMessage(err) ?? 'Archivo no válido (formato o tamaño).';
    }
    if (err.status === 413) {
      return 'El archivo supera el límite del servidor (proxy o API). Máximo permitido: 50 MB.';
    }
    return 'No se pudo completar la publicación del reel.';
  }

  private resolveLoadErrorMessage(err: unknown): string | null {
    if (!(err instanceof HttpErrorResponse)) {
      return 'No se pudo cargar el contenido multimedia.';
    }
    if (err.status === 0) {
      return 'Sin conexión con el servidor.';
    }
    if (err.status === 401) {
      return 'Inicia sesión para ver tu contenido multimedia.';
    }
    if (err.status >= 500) {
      return 'El servidor respondió con un error. Inténtalo más tarde.';
    }
    // 403/404: estado vacío sin mensaje de error genérico
    if (err.status === 403 || err.status === 404) {
      return null;
    }
    return 'No se pudo cargar el contenido multimedia.';
  }

  private resolveDeleteErrorMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) {
      return 'No se pudo eliminar el reel.';
    }
    if (err.status === 0) {
      return 'Sin conexión con el servidor.';
    }
    if (err.status === 401) {
      return 'Debes iniciar sesión para eliminar reels.';
    }
    if (err.status === 403) {
      return 'No tienes permiso para eliminar este reel.';
    }
    if (err.status === 404) {
      return 'El reel ya no existe o no se encontró.';
    }
    return 'No se pudo eliminar el reel.';
  }
}
