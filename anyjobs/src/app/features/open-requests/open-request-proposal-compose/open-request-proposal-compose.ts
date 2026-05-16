import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { OpenRequestsService } from '../open-requests.service';
import { OpenRequestsAnalyticsService } from '../open-requests-analytics.service';
import { OpenRequestDetail as OpenRequestDetailModel } from '../open-requests.models';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';

function proposalSubmitErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object') {
    const body = err.error as { errorCode?: string; message?: string };
    if (body.errorCode === 'PROPOSAL.CANNOT_APPLY_TO_OWN_REQUEST') {
      return 'No puedes postularte a tu propia request.';
    }
    if (body.errorCode === 'PROPOSAL.ALREADY_EXISTS') {
      return 'Ya enviaste una propuesta para esta solicitud.';
    }
    if (typeof body.message === 'string' && body.message.trim().length > 0) {
      return body.message.trim();
    }
  }
  if (err instanceof Error) return err.message;
  return 'No se pudo enviar la propuesta.';
}

@Component({
  selector: 'app-open-request-proposal-compose',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './open-request-proposal-compose.html',
  styleUrl: './open-request-proposal-compose.scss',
})
export class OpenRequestProposalCompose {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly openRequests = inject(OpenRequestsService);
  private readonly proposals = inject(ProposalsService);
  private readonly analytics = inject(OpenRequestsAnalyticsService);

  private proposalStartedSentForId: string | null = null;
  protected readonly authVm = inject(AuthSessionService).vm;

  protected readonly requestId = toSignal(this.route.paramMap.pipe(map((pm) => (pm.get('id') ?? '').trim())), {
    initialValue: '',
  });

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly detail = signal<OpenRequestDetailModel | null>(null);
  protected readonly sent = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isOwnRequest = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    whoAmI: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    message: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(20)]),
    estimate: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => (pm.get('id') ?? '').trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => this.load(id));
  }

  protected retry(): void {
    this.load(this.requestId());
  }

  protected openLogin(): void {
    this.router.navigate([], { queryParams: { login: 1 }, queryParamsHandling: 'merge' });
  }

  protected cancel(): void {
    const id = this.requestId();
    this.router.navigate(['/solicitudes', id]);
  }

  protected goToMyRequests(): void {
    this.router.navigateByUrl('/mis-solicitudes');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.authVm().user;
    const userId = user?.id ?? '';
    if (!this.authVm().isLoggedIn || userId.trim().length === 0) {
      this.openLogin();
      return;
    }

    if (this.isOwnRequest()) {
      this.errorMessage.set('No puedes postularte a tu propia request.');
      return;
    }

    const value = this.form.getRawValue();
    this.errorMessage.set(null);

    this.proposals
      .sendProposal({
        requestId: this.requestId(),
        userId,
        authorName: user?.fullName ?? undefined,
        authorSubtitle: user?.city ? `${user.city}${user.area ? ` · ${user.area}` : ''}` : undefined,
        whoAmI: value.whoAmI,
        message: value.message,
        estimate: value.estimate,
      })
      .pipe(
        catchError((err: unknown) => {
          this.errorMessage.set(proposalSubmitErrorMessage(err));
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.sent.set(true);
        },
      });
  }

  private load(id: string): void {
    if (!id) {
      this.detail.set(null);
      this.state.set('error');
      return;
    }

    this.sent.set(false);
    this.errorMessage.set(null);
    this.isOwnRequest.set(false);
    this.state.set('loading');

    this.openRequests
      .getOpenRequestDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.detail.set(d);
          const uid = this.authVm().user?.id?.trim() ?? '';
          const owner = d.ownerUserId?.trim() ?? '';
          this.isOwnRequest.set(Boolean(uid && owner && uid === owner));
          this.state.set('success');
          if (this.proposalStartedSentForId !== id) {
            this.proposalStartedSentForId = id;
            this.analytics.track({
              kind: 'proposalStarted',
              openRequestId: id,
              route: `/solicitudes/${id}/propuesta`,
            });
          }
        },
        error: () => {
          this.detail.set(null);
          this.state.set('error');
        },
      });
  }
}

