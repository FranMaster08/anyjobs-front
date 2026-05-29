import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, finalize, map, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../../components/modal/modal';
import { UserIdentityLinkComponent } from '../../../shared/components/user-identity-link/user-identity-link';
import { WorkConditionIconComponent } from '../work-condition-icon/work-condition-icon';
import { OpenRequestDetail as OpenRequestDetailModel } from '../open-requests.models';
import {
  hasWorkConditionsData,
  listWorkConditionDisplayItems,
  type WorkConditionDisplayItem,
} from '../open-request-work-conditions.constants';
import { OpenRequestsService } from '../open-requests.service';
import {
  isRequestCancelled,
  normalizeLifecycleStatus,
} from '../open-request-lifecycle-labels';
import { OpenRequestsAnalyticsService } from '../open-requests-analytics.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { UserApi } from '../../../shared/api/user.api';
import type { UserPublicProfileDto } from '../../../shared/api/user-profile.models';
import { ProposalsService } from '../../../shared/proposals/proposals.service';

/**
 * Pantalla de detalle de solicitud abierta.
 * Responsabilidad: mostrar el id y servir como destino de navegación desde el listado.
 */
@Component({
  selector: 'app-open-request-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ModalComponent, UserIdentityLinkComponent, WorkConditionIconComponent],
  templateUrl: './open-request-detail.html',
  styleUrl: './open-request-detail.scss',
})
export class OpenRequestDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly service = inject(OpenRequestsService);
  private readonly analytics = inject(OpenRequestsAnalyticsService);
  private readonly authSession = inject(AuthSessionService);
  private readonly userApi = inject(UserApi);
  private readonly proposals = inject(ProposalsService);

  private detailViewStartedAt: number | null = null;
  private trackedDetailRequestId: string | null = null;
  private publisherProfileLoadSeq = 0;

  protected readonly authVm = this.authSession.vm;

  protected readonly requestId = toSignal(this.route.paramMap.pipe(map((pm) => pm.get('id') ?? '')), {
    initialValue: '',
  });

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly detail = signal<OpenRequestDetailModel | null>(null);

  protected readonly activeImageIndex = signal(0);
  protected readonly isGalleryOpen = signal(false);

  /** Creador autenticado con sesión y ownerUserId válido en el detalle. */
  protected readonly isOwnerWithSession = computed(() => {
    const d = this.detail();
    const owner = d?.ownerUserId?.trim() ?? '';
    if (!d || owner.length === 0) return false;

    const auth = this.authVm();
    if (!auth.isLoggedIn) return false;
    const uid = auth.user?.id?.trim() ?? '';
    if (uid.length === 0) return false;

    return owner === uid;
  });

  protected readonly isRequestOwner = computed(() => this.isOwnerWithSession());

  protected readonly requestLifecycleStatus = computed(() =>
    normalizeLifecycleStatus(this.detail()?.lifecycleStatus),
  );

  protected readonly isRequestActive = computed(
    () => !isRequestCancelled(this.requestLifecycleStatus()),
  );

  protected readonly isRequestCancelled = computed(() =>
    isRequestCancelled(this.requestLifecycleStatus()),
  );

  protected readonly cancelConfirmOpen = signal(false);
  protected readonly cancelInProgress = signal(false);
  protected readonly cancelError = signal<string | null>(null);

  /** `null` = cargando contador para el dueño. */
  protected readonly postulantesCount = signal<number | null>(null);

  protected readonly postulantesLinkLabel = computed(() => {
    const count = this.postulantesCount();
    if (count == null || count <= 0) return '';
    return `Ver postulantes (${count})`;
  });

  protected readonly postulantesHasApplicants = computed(() => (this.postulantesCount() ?? 0) > 0);

  protected readonly postulantesCountLoading = computed(() => this.postulantesCount() === null);

  protected readonly showWorkConditionsSection = computed(() => {
    const d = this.detail();
    return d?.workConditions ? hasWorkConditionsData(d.workConditions) : false;
  });

  protected readonly workConditionRows = computed(() => {
    const d = this.detail();
    if (!d?.workConditions) return [];
    return listWorkConditionDisplayItems(d.workConditions);
  });

  protected readonly workConditionsAdditionalInstructions = computed(() => {
    const text = this.detail()?.workConditions?.additionalInstructions?.trim() ?? '';
    return text.length > 0 ? text : null;
  });

  protected readonly publisherProfile = signal<UserPublicProfileDto | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.flushDetailDwellTime());

    this.route.paramMap
      .pipe(
        map((pm) => (pm.get('id') ?? '').trim()),
        switchMap((id) => {
          this.flushDetailDwellTime();
          this.resetPublisherProfile();
          this.isGalleryOpen.set(false);

          if (!id) {
            this.detail.set(null);
            this.postulantesCount.set(null);
            this.state.set('error');
            return EMPTY;
          }

          this.postulantesCount.set(null);
          this.state.set('loading');
          return this.service.getOpenRequestDetail(id).pipe(map((detail) => ({ id, detail })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ id, detail }) => {
          this.detail.set(detail);
          this.activeImageIndex.set(0);
          this.state.set('success');
          this.detailViewStartedAt = Date.now();
          if (this.trackedDetailRequestId !== id) {
            this.trackedDetailRequestId = id;
            this.analytics.track({
              kind: 'requestDetailView',
              openRequestId: id,
              route: `/solicitudes/${id}`,
            });
          }
          this.loadPublisherProfile(detail);
          this.loadPostulantesCount(id, detail);
        },
        error: () => {
          this.detail.set(null);
          this.postulantesCount.set(null);
          this.state.set('error');
        },
      });
  }

  @HostListener('document:keydown', ['$event'])
  protected onGalleryKeydown(event: KeyboardEvent): void {
    if (!this.isGalleryOpen()) return;
    const images = this.detail()?.images ?? [];
    if (images.length < 2) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevImage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextImage();
    }
  }

  protected retry(): void {
    const id = this.requestId().trim();
    if (!id) return;

    this.state.set('loading');
    this.resetPublisherProfile();
    this.postulantesCount.set(null);

    this.service
      .getOpenRequestDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.activeImageIndex.set(0);
          this.state.set('success');
          this.loadPublisherProfile(detail);
          this.loadPostulantesCount(id, detail);
        },
        error: () => {
          this.detail.set(null);
          this.postulantesCount.set(null);
          this.state.set('error');
        },
      });
  }

  protected selectImage(index: number): void {
    const images = this.detail()?.images ?? [];
    if (index < 0 || index >= images.length) return;
    this.activeImageIndex.set(index);
  }

  protected openGallery(index?: number, event?: Event): void {
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

  protected openCancelConfirm(): void {
    this.cancelError.set(null);
    this.cancelConfirmOpen.set(true);
  }

  protected closeCancelConfirm(): void {
    if (this.cancelInProgress()) return;
    this.cancelConfirmOpen.set(false);
  }

  protected confirmCancelRequest(): void {
    const id = this.requestId().trim();
    if (!id || !this.isRequestOwner() || !this.isRequestActive()) return;

    this.cancelInProgress.set(true);
    this.cancelError.set(null);

    this.service
      .cancelOpenRequest(id)
      .pipe(
        finalize(() => this.cancelInProgress.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.cancelConfirmOpen.set(false);
        },
        error: () => {
          this.cancelError.set('No pudimos cancelar la solicitud. Intenta de nuevo.');
        },
      });
  }

  protected goToProposal(): void {
    const id = this.requestId();
    if (!id || this.isRequestOwner() || this.isRequestCancelled()) return;
    this.analytics.track({
      kind: 'proposalStarted',
      openRequestId: id,
      route: `/solicitudes/${id}/propuesta`,
    });
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

  protected trackWorkConditionRow(_index: number, row: WorkConditionDisplayItem): string {
    return row.key;
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

  private loadPostulantesCount(requestId: string, detail: OpenRequestDetailModel): void {
    const ownerId = detail.ownerUserId?.trim() ?? '';
    const auth = this.authVm();
    const viewerId = auth.user?.id?.trim() ?? '';
    if (!auth.isLoggedIn || ownerId.length === 0 || viewerId !== ownerId) {
      this.postulantesCount.set(null);
      return;
    }

    this.proposals
      .listByRequest(requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.postulantesCount.set(items.length),
        error: () => this.postulantesCount.set(0),
      });
  }

  protected publisherDisplayName(d: OpenRequestDetailModel): string {
    const fromProfile = this.publisherProfile()?.fullName?.trim() ?? '';
    if (fromProfile.length > 0) return fromProfile;

    if (!this.isDemoProviderData(d)) {
      const name = d.provider?.name?.trim() ?? '';
      if (name.length > 0) return name;
    }
    return 'Publicador';
  }

  protected publisherSubtitle(d: OpenRequestDetailModel): string | undefined {
    const headline = this.publisherProfile()?.workerHeadline?.trim() ?? '';
    if (headline.length > 0) return headline;

    if (this.isDemoProviderData(d)) return undefined;
    const sub = d.provider?.subtitle?.trim() ?? '';
    return sub.length > 0 ? sub : undefined;
  }

  protected isDemoProviderData(d: OpenRequestDetailModel): boolean {
    const provider = d.provider;
    const name = (provider?.name ?? '').trim();
    const badge = (provider?.badge ?? '').trim();
    const subtitle = (provider?.subtitle ?? '').trim();
    const reputation = d.reputation ?? 0;
    const reviewsCount = d.reviewsCount ?? 0;
    const reviews = d.providerReviews ?? [];

    return (
      (name === 'Cliente' || name.length === 0) &&
      (badge === 'NUEVO' || badge.length === 0) &&
      (subtitle === 'Solicitud publicada' || subtitle.length === 0) &&
      reputation === 0 &&
      reviewsCount === 0 &&
      reviews.length === 0
    );
  }

  protected showPublisherReputation(d: OpenRequestDetailModel): boolean {
    if (this.isDemoProviderData(d)) return false;
    return (d.reputation ?? 0) > 0 || (d.reviewsCount ?? 0) > 0;
  }

  private resetPublisherProfile(): void {
    this.publisherProfileLoadSeq += 1;
    this.publisherProfile.set(null);
  }

  private loadPublisherProfile(detail: OpenRequestDetailModel): void {
    const ownerUserId = detail.ownerUserId?.trim() ?? '';
    if (ownerUserId.length === 0) {
      this.resetPublisherProfile();
      return;
    }

    const seq = ++this.publisherProfileLoadSeq;
    this.userApi.getPublicProfile(ownerUserId).subscribe({
      next: (profile) => {
        if (seq !== this.publisherProfileLoadSeq) return;
        if (this.detail()?.ownerUserId?.trim() !== ownerUserId) return;
        this.publisherProfile.set(profile);
      },
      error: () => {
        if (seq !== this.publisherProfileLoadSeq) return;
        this.publisherProfile.set(null);
      },
    });
  }

  private flushDetailDwellTime(): void {
    const id = this.trackedDetailRequestId;
    const startedAt = this.detailViewStartedAt;
    this.detailViewStartedAt = null;
    this.trackedDetailRequestId = null;
    if (!id || startedAt === null) return;

    const viewDurationMs = Math.max(0, Date.now() - startedAt);
    this.analytics.track({
      kind: 'timeOnDetailMs',
      openRequestId: id,
      route: `/solicitudes/${id}`,
      viewDurationMs,
    });
  }
}
