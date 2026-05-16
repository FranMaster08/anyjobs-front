import { CommonModule } from '@angular/common';
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
import { catchError, finalize, of, switchMap } from 'rxjs';

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
  protected readonly error = signal<string | null>(null);
  protected readonly uploadBusy = signal(false);
  protected readonly playerReel = signal<UserReelDto | null>(null);

  constructor() {
    effect(() => {
      if (this.tabActive() && this.profileUserId()) {
        this.loadReels();
      }
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.isOwnProfile()) return;

    const allowed = ['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.error.set('Formato no permitido. Usa MP4, WebM o imagen JPG/PNG/WebP.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.error.set('El archivo supera 50 MB.');
      return;
    }

    this.uploadBusy.set(true);
    this.error.set(null);
    this.mediaApi
      .uploadAsset(file)
      .pipe(
        switchMap((asset) =>
          this.mediaApi.createReel(asset.id).pipe(
            switchMap((reel) => this.mediaApi.publishReel(reel.id)),
          ),
        ),
        catchError(() => {
          this.error.set('No se pudo completar la publicación del reel.');
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
    this.loading.set(true);
    this.error.set(null);
    const req = this.isOwnProfile()
      ? this.mediaApi.listMyReels()
      : this.mediaApi.listPublicReels(this.profileUserId());

    req
      .pipe(
        catchError(() => {
          this.error.set('No se pudo cargar el contenido multimedia.');
          return of({ items: [] as UserReelDto[] });
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        const items = this.isOwnProfile()
          ? res.items
          : res.items.filter((r) => r.moderationStatus === 'approved' && r.distributionStatus !== 'draft');
        this.reels.set(items);
      });
  }
}
