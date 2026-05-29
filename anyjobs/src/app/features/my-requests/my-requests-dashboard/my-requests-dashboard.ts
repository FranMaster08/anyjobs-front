import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { ModalComponent } from '../../../components/modal/modal';
import { UserIdentityLinkComponent } from '../../../shared/components/user-identity-link/user-identity-link';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';
import { Proposal } from '../../../shared/proposals/proposals.models';
import { formatNotificationRelativeTime } from '../../../shared/notifications/notifications-relative-time';
import { OpenRequestsService } from '../../open-requests/open-requests.service';
import {
  OpenRequestDetail,
  OpenRequestListItem,
} from '../../open-requests/open-requests.models';
import {
  isRequestCancelled,
  normalizeLifecycleStatus,
  openRequestLifecycleLabel,
  type OpenRequestLifecycleStatus,
} from '../../open-requests/open-request-lifecycle-labels';

interface AppliedRequestItem {
  readonly proposal: Proposal;
  readonly request: OpenRequestDetail | null;
}

type LoadState = 'loading' | 'success' | 'error';
type TabId = 'published' | 'applied';

function postulantesHttpMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string } | null;
    if (body && typeof body.message === 'string' && body.message.trim().length > 0) {
      return body.message.trim();
    }
  }
  return 'No se pudieron cargar las postulaciones.';
}

@Component({
  selector: 'app-my-requests-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ModalComponent, UserIdentityLinkComponent],
  templateUrl: './my-requests-dashboard.html',
  styleUrl: './my-requests-dashboard.scss',
})
export class MyRequestsDashboard {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly proposals = inject(ProposalsService);
  private readonly openRequests = inject(OpenRequestsService);
  protected readonly authVm = inject(AuthSessionService).vm;

  protected readonly activeTab = signal<TabId>('published');

  protected readonly publishedState = signal<LoadState>('loading');
  protected readonly publishedItems = signal<readonly OpenRequestListItem[]>([]);

  protected readonly appliedState = signal<LoadState>('loading');
  protected readonly appliedItems = signal<readonly AppliedRequestItem[]>([]);

  protected readonly publishedCount = computed(() => this.publishedItems().length);
  protected readonly appliedCount = computed(() => this.appliedItems().length);

  /** Solicitudes publicadas: ver postulantes (solo el dueño puede cargar desde API). */
  protected readonly publishedPostulantesExpanded = signal<ReadonlySet<string>>(new Set());
  /** Postulé a estas: desplegar detalle de la propia propuesta (sin listar a terceros). */
  protected readonly appliedProposalDetailExpanded = signal<ReadonlySet<string>>(new Set());

  protected readonly requestProposals = signal<Record<string, readonly Proposal[] | undefined>>({});
  protected readonly postulantesLoadingIds = signal<ReadonlySet<string>>(new Set());
  protected readonly proposalPostulantesError = signal<Record<string, string | undefined>>({});

  protected readonly isChooseWipOpen = signal(false);
  protected readonly chooseWipName = signal<string>('este usuario');

  constructor() {
    this.load();
  }

  protected setTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  protected retryPublished(): void {
    this.loadPublished();
  }

  protected retryApplied(): void {
    this.loadApplied();
  }

  protected openLogin(): void {
    this.router.navigate([], { queryParams: { login: 1 }, queryParamsHandling: 'merge' });
  }

  protected openChooseWip(proposal: Proposal): void {
    const name = proposal.author?.name?.trim();
    this.chooseWipName.set(name && name.length > 0 ? name : 'este usuario');
    this.isChooseWipOpen.set(true);
  }

  protected closeChooseWip(): void {
    this.isChooseWipOpen.set(false);
  }

  protected publishedLifecycleStatus(it: OpenRequestListItem): OpenRequestLifecycleStatus {
    return normalizeLifecycleStatus(it.lifecycleStatus);
  }

  protected publishedLifecycleLabel(it: OpenRequestListItem): string {
    return openRequestLifecycleLabel(this.publishedLifecycleStatus(it), 'owner');
  }

  protected publishedChipClass(it: OpenRequestListItem): string {
    return this.publishedLifecycleStatus(it) === 'CANCELLED' ? 'chip--closed' : 'chip--active';
  }

  protected appliedHasThumb(it: AppliedRequestItem): boolean {
    return (it.request?.images?.length ?? 0) > 0;
  }

  protected appliedRequestCancelled(it: AppliedRequestItem): boolean {
    return isRequestCancelled(normalizeLifecycleStatus(it.request?.lifecycleStatus));
  }

  protected appliedStatusLabel(it: AppliedRequestItem): string {
    const status = normalizeLifecycleStatus(it.request?.lifecycleStatus);
    return openRequestLifecycleLabel(status, 'applicant');
  }

  protected appliedStatusChipClass(it: AppliedRequestItem): string {
    return this.appliedRequestCancelled(it) ? 'chip--cancelled' : 'chip--status';
  }

  protected togglePublishedPostulantes(requestId: string): void {
    const rid = requestId.trim();
    if (!rid) return;

    const wasExpanded = this.publishedPostulantesExpanded().has(rid);
    this.publishedPostulantesExpanded.update((prev) => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });
    if (wasExpanded) return;

    const loaded = this.requestProposals()[rid] !== undefined;
    if (loaded) return;

    this.loadPostulantes(rid);
  }

  protected retryPostulantes(requestId: string): void {
    const rid = requestId.trim();
    if (!rid) return;
    this.loadPostulantes(rid);
  }

  protected postulantesCountLabel(requestId: string): string {
    const count = this.proposalsForRequest(requestId).length;
    if (count === 0) return 'Sin postulantes';
    if (count === 1) return '1 postulante';
    return `${count} postulantes`;
  }

  protected shouldShowWhoAmI(proposal: Proposal): boolean {
    const who = proposal.whoAmI?.trim() ?? '';
    const message = proposal.message?.trim() ?? '';
    if (!who) return false;
    return who !== message;
  }

  protected proposalCreatedAtLabel(proposal: Proposal): string {
    const iso = proposal.createdAt?.trim() ?? '';
    if (!iso) return '';
    const relative = formatNotificationRelativeTime(iso);
    if (!relative) return '';
    if (relative.startsWith('Hace')) {
      return `Postulada ${relative.charAt(0).toLowerCase()}${relative.slice(1)}`;
    }
    return `Postulada el ${relative}`;
  }

  protected proposalCreatedAtTitle(proposal: Proposal): string {
    const iso = proposal.createdAt?.trim() ?? '';
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return '';
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(ts));
  }

  private loadPostulantes(requestId: string): void {
    const rid = requestId.trim();
    if (!rid) return;

    this.proposalPostulantesError.update((prev) => ({ ...prev, [rid]: undefined }));
    this.postulantesLoadingIds.update((prev) => new Set(prev).add(rid));

    this.proposals
      .listByRequest(rid)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: unknown) => {
          this.proposalPostulantesError.update((prev) => ({ ...prev, [rid]: postulantesHttpMessage(err) }));
          return of([] as const);
        }),
      )
      .subscribe((items) => {
        this.requestProposals.update((prev) => ({ ...prev, [rid]: items }));
        this.postulantesLoadingIds.update((prev) => {
          const next = new Set(prev);
          next.delete(rid);
          return next;
        });
      });
  }

  protected isPublishedPostulantesExpanded(requestId: string): boolean {
    return this.publishedPostulantesExpanded().has(requestId);
  }

  protected isPostulantesLoading(requestId: string): boolean {
    return this.postulantesLoadingIds().has(requestId);
  }

  protected postulantesErrorFor(requestId: string): string | undefined {
    return this.proposalPostulantesError()[requestId];
  }

  protected toggleAppliedProposalDetail(proposalId: string): void {
    const id = proposalId.trim();
    if (!id) return;
    this.appliedProposalDetailExpanded.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected isAppliedProposalExpanded(proposalId: string): boolean {
    return this.appliedProposalDetailExpanded().has(proposalId);
  }

  protected proposalsForRequest(requestId: string): readonly Proposal[] {
    return this.requestProposals()[requestId] ?? [];
  }

  protected postulantesLoaded(requestId: string): boolean {
    return this.requestProposals()[requestId] !== undefined;
  }

  private openPostulantesFromQueryParam(): void {
    const requestId = this.route.snapshot.queryParamMap.get('postulantes')?.trim() ?? '';
    if (!requestId) return;
    if (!this.publishedItems().some((it) => it.id === requestId)) return;

    this.activeTab.set('published');
    this.togglePublishedPostulantes(requestId);

    if (typeof document === 'undefined') return;
    setTimeout(() => {
      document.getElementById(`request-${requestId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  private load(): void {
    this.publishedItems.set([]);
    this.appliedItems.set([]);
    this.requestProposals.set({});
    this.publishedPostulantesExpanded.set(new Set());
    this.appliedProposalDetailExpanded.set(new Set());
    this.postulantesLoadingIds.set(new Set());
    this.proposalPostulantesError.set({});

    const vm = this.authVm();
    const userId = vm.user?.id ?? '';

    if (!vm.isLoggedIn || userId.trim().length === 0) {
      this.publishedState.set('success');
      this.appliedState.set('success');
      return;
    }

    this.loadPublished();
    this.loadApplied();
  }

  private loadPublished(): void {
    this.publishedState.set('loading');
    this.openRequests
      .listMyOpenRequests({ page: 1, pageSize: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.publishedItems.set(res.items);
          this.publishedState.set('success');
          this.openPostulantesFromQueryParam();
        },
        error: () => {
          this.publishedItems.set([]);
          this.publishedState.set('error');
        },
      });
  }

  private loadApplied(): void {
    const vm = this.authVm();
    const userId = vm.user?.id ?? '';
    if (!vm.isLoggedIn || userId.trim().length === 0) {
      this.appliedItems.set([]);
      this.appliedState.set('success');
      return;
    }

    this.appliedState.set('loading');

    this.proposals
      .listByUser(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((proposals) => {
          if (proposals.length === 0) return of([] as AppliedRequestItem[]);

          return forkJoin(
            proposals.map((p) =>
              this.openRequests.getOpenRequestDetail(p.requestId).pipe(
                map((req) => ({ proposal: p, request: req }) satisfies AppliedRequestItem),
                catchError(() => of({ proposal: p, request: null } satisfies AppliedRequestItem)),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: (items) => {
          this.appliedItems.set(items);
          this.appliedState.set('success');
        },
        error: () => {
          this.appliedItems.set([]);
          this.appliedState.set('error');
        },
      });
  }
}
