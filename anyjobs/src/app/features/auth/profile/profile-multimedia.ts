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
import { catchError, finalize, of, Subscription, switchMap } from 'rxjs';

import { ModalComponent } from '../../../components/modal/modal';
import type { UserReelDto } from '../../../shared/api/user-media.api';
import { UserMediaApi } from '../../../shared/api/user-media.api';

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

    const allowed = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-m4v',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowed.includes(file.type)) {
      this.uploadError.set('Formato no permitido. Usa MP4, WebM o imagen JPG/PNG/WebP.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.uploadError.set('El archivo supera 50 MB.');
      return;
    }

    this.uploadBusy.set(true);
    this.uploadError.set(null);
    this.mediaApi
      .uploadAsset(file)
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
      const msg = typeof err.error?.message === 'string' ? err.error.message : null;
      return msg ?? 'Archivo no válido (formato o tamaño).';
    }
    if (err.status === 413) {
      return 'El archivo supera el límite permitido.';
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
}
