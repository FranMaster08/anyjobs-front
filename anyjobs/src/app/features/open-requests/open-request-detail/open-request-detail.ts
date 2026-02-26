import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../../components/modal/modal';
import { OpenRequestDetail as OpenRequestDetailModel } from '../open-requests.models';
import { OpenRequestsService } from '../open-requests.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';

/**
 * Pantalla de detalle de solicitud abierta.
 * Responsabilidad: mostrar el id y servir como destino de navegación desde el listado.
 * Nota: el contenido final se implementará cuando exista el contrato/endpoint de detalle.
 */
@Component({
  selector: 'app-open-request-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ModalComponent],
  templateUrl: './open-request-detail.html',
  styleUrl: './open-request-detail.scss',
})
export class OpenRequestDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly service = inject(OpenRequestsService);
  protected readonly authVm = inject(AuthSessionService).vm;

  protected readonly requestId = toSignal(
    this.route.paramMap.pipe(map((pm) => pm.get('id') ?? '')),
    { initialValue: '' },
  );

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly detail = signal<OpenRequestDetailModel | null>(null);

  protected readonly activeImageIndex = signal(0);
  protected readonly isGalleryOpen = signal(false);
  protected readonly isPostulateOpen = signal(false);

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => (pm.get('id') ?? '').trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => {
        this.load(id);
      });
  }

  protected retry(): void {
    this.load(this.requestId());
  }

  protected selectImage(index: number): void {
    const images = this.detail()?.images ?? [];
    if (index < 0 || index >= images.length) return;
    this.activeImageIndex.set(index);
  }

  protected openGallery(index?: number): void {
    if (typeof index === 'number') this.selectImage(index);
    this.isGalleryOpen.set(true);
  }

  protected closeGallery(): void {
    this.isGalleryOpen.set(false);
  }

  protected openPostulate(): void {
    this.isPostulateOpen.set(true);
  }

  protected closePostulate(): void {
    this.isPostulateOpen.set(false);
  }

  protected prevImage(): void {
    const images = this.detail()?.images ?? [];
    if (images.length === 0) return;
    const next = (this.activeImageIndex() - 1 + images.length) % images.length;
    this.activeImageIndex.set(next);
  }

  protected nextImage(): void {
    const images = this.detail()?.images ?? [];
    if (images.length === 0) return;
    const next = (this.activeImageIndex() + 1) % images.length;
    this.activeImageIndex.set(next);
  }

  protected scrollToApply(): void {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('applyCard');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected scrollToTop(): void {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  private load(id: string): void {
    if (!id) {
      this.detail.set(null);
      this.state.set('error');
      return;
    }

    this.state.set('loading');
    this.service
      .getOpenRequestDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.activeImageIndex.set(0);
          this.state.set('success');
        },
        error: () => {
          this.detail.set(null);
          this.state.set('error');
        },
      });
  }
}

