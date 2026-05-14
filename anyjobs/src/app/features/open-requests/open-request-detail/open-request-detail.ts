import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { ModalComponent } from '../../../components/modal/modal';
import { OpenRequestDetail as OpenRequestDetailModel } from '../open-requests.models';
import { OpenRequestsService } from '../open-requests.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';
import { Proposal } from '../../../shared/proposals/proposals.models';

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
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly service = inject(OpenRequestsService);
  private readonly proposals = inject(ProposalsService);
  protected readonly authVm = inject(AuthSessionService).vm;

  protected readonly requestId = toSignal(this.route.paramMap.pipe(map((pm) => pm.get('id') ?? '')), {
    initialValue: '',
  });

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly detail = signal<OpenRequestDetailModel | null>(null);

  protected readonly activeImageIndex = signal(0);
  protected readonly isGalleryOpen = signal(false);

  protected readonly isRequestOwner = computed(() => {
    const d = this.detail();
    const uid = this.authVm().user?.id?.trim() ?? '';
    const owner = d?.ownerUserId?.trim() ?? '';
    if (!d || uid.length === 0 || owner.length === 0) return false;
    return owner === uid;
  });

  protected readonly postulantesState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected readonly postulantes = signal<readonly Proposal[]>([]);
  protected readonly postulantesError = signal<string | null>(null);

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

  protected openGallery(index?: number, event?: Event): void {
    // Evitar que el mismo click/tap cierre el modal instantáneamente
    // (especialmente en móviles, donde el click es sintético post-touch).
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (typeof index === 'number') this.selectImage(index);

    setTimeout(() => {
      this.isGalleryOpen.set(true);
    }, 0);
  }

  protected closeGallery(): void {
    this.isGalleryOpen.set(false);
  }

  protected goToProposal(): void {
    const id = this.requestId();
    if (!id || this.isRequestOwner()) return;
    this.router.navigate(['/solicitudes', id, 'propuesta']);
  }

  protected openLogin(): void {
    this.router.navigate([], { queryParams: { login: 1 }, queryParamsHandling: 'merge' });
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

  private loadPostulantesIfOwner(requestId: string, detail: OpenRequestDetailModel): void {
    const uid = this.authVm().user?.id?.trim() ?? '';
    const owner = detail.ownerUserId?.trim() ?? '';
    if (!uid || !owner || owner !== uid) {
      this.postulantesState.set('idle');
      this.postulantes.set([]);
      this.postulantesError.set(null);
      return;
    }

    this.postulantesState.set('loading');
    this.postulantesError.set(null);

    this.proposals
      .listByRequest(requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.postulantes.set(items);
          this.postulantesState.set('success');
        },
        error: (err: unknown) => {
          const msg =
            err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
              ? err.error.message
              : 'No se pudieron cargar las postulaciones.';
          this.postulantesError.set(msg);
          this.postulantesState.set('error');
        },
      });
  }

  private load(id: string): void {
    if (!id) {
      this.detail.set(null);
      this.state.set('error');
      return;
    }

    this.state.set('loading');
    this.postulantesState.set('idle');
    this.postulantes.set([]);
    this.postulantesError.set(null);

    this.service
      .getOpenRequestDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.activeImageIndex.set(0);
          this.state.set('success');
          this.loadPostulantesIfOwner(id, detail);
        },
        error: () => {
          this.detail.set(null);
          this.state.set('error');
        },
      });
  }
}
