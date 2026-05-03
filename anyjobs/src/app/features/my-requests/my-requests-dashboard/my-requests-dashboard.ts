import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { ModalComponent } from '../../../components/modal/modal';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';
import { Proposal } from '../../../shared/proposals/proposals.models';
import { OpenRequestsService } from '../../open-requests/open-requests.service';
import {
  OpenRequestDetail,
  OpenRequestListItem,
} from '../../open-requests/open-requests.models';

interface AppliedRequestItem {
  readonly proposal: Proposal;
  readonly request: OpenRequestDetail | null;
}

type LoadState = 'loading' | 'success' | 'error';
type TabId = 'published' | 'applied';

@Component({
  selector: 'app-my-requests-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ModalComponent],
  templateUrl: './my-requests-dashboard.html',
  styleUrl: './my-requests-dashboard.scss',
})
export class MyRequestsDashboard {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
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

  protected readonly expandedRequests = signal<ReadonlySet<string>>(new Set());
  protected readonly requestProposals = signal<Record<string, readonly Proposal[]>>({});

  protected readonly isProfileWipOpen = signal(false);
  protected readonly profileWipName = signal<string>('este usuario');
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

  protected openProfileWip(proposal: Proposal): void {
    const name = proposal.author?.name?.trim();
    this.profileWipName.set(name && name.length > 0 ? name : 'este usuario');
    this.isProfileWipOpen.set(true);
  }

  protected closeProfileWip(): void {
    this.isProfileWipOpen.set(false);
  }

  protected openChooseWip(proposal: Proposal): void {
    const name = proposal.author?.name?.trim();
    this.chooseWipName.set(name && name.length > 0 ? name : 'este usuario');
    this.isChooseWipOpen.set(true);
  }

  protected closeChooseWip(): void {
    this.isChooseWipOpen.set(false);
  }

  protected toggleExpanded(requestId: string): void {
    const rid = requestId.trim();
    if (!rid) return;

    this.expandedRequests.update((prev) => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });

    const existing = this.requestProposals()[rid];
    if (existing && existing.length > 0) return;

    const uid = this.authVm().user?.id ?? '';
    this.proposals
      .listByRequest(rid, uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.requestProposals.update((prev) => ({ ...prev, [rid]: items }));
      });
  }

  protected isExpanded(requestId: string): boolean {
    return this.expandedRequests().has(requestId);
  }

  protected proposalsForRequest(requestId: string): readonly Proposal[] {
    return this.requestProposals()[requestId] ?? [];
  }

  private load(): void {
    this.publishedItems.set([]);
    this.appliedItems.set([]);
    this.requestProposals.set({});
    this.expandedRequests.set(new Set());

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
