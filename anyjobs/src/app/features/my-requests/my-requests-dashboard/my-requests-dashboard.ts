import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { ModalComponent } from '../../../components/modal/modal';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';
import { Proposal } from '../../../shared/proposals/proposals.models';
import { OpenRequestsService } from '../../open-requests/open-requests.service';
import { OpenRequestDetail } from '../../open-requests/open-requests.models';

type MyRequestItem = {
  readonly proposal: Proposal;
  readonly request: OpenRequestDetail | null;
};

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

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly items = signal<readonly MyRequestItem[]>([]);

  protected readonly expandedRequests = signal<ReadonlySet<string>>(new Set());
  protected readonly requestProposals = signal<Record<string, readonly Proposal[]>>({});

  protected readonly isProfileWipOpen = signal(false);
  protected readonly profileWipName = signal<string>('este usuario');
  protected readonly isChooseWipOpen = signal(false);
  protected readonly chooseWipName = signal<string>('este usuario');

  constructor() {
    this.load();
  }

  protected retry(): void {
    this.load();
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
    this.items.set([]);
    this.requestProposals.set({});
    this.expandedRequests.set(new Set());

    const vm = this.authVm();
    const userId = vm.user?.id ?? '';

    if (!vm.isLoggedIn || userId.trim().length === 0) {
      this.state.set('success');
      return;
    }

    this.state.set('loading');

    this.proposals
      .listByUser(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((proposals) => {
          if (proposals.length === 0) return of([] as MyRequestItem[]);

          return forkJoin(
            proposals.map((p) =>
              this.openRequests.getOpenRequestDetail(p.requestId).pipe(
                map((req) => ({ proposal: p, request: req } satisfies MyRequestItem)),
                catchError(() => of({ proposal: p, request: null } satisfies MyRequestItem)),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.state.set('success');
        },
        error: () => {
          this.items.set([]);
          this.state.set('error');
        },
      });
  }
}

