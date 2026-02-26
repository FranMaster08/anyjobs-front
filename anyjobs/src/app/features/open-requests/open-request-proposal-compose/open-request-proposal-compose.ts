import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OpenRequestsService } from '../open-requests.service';
import { OpenRequestDetail as OpenRequestDetailModel } from '../open-requests.models';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';

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
  protected readonly authVm = inject(AuthSessionService).vm;

  protected readonly requestId = toSignal(this.route.paramMap.pipe(map((pm) => (pm.get('id') ?? '').trim())), {
    initialValue: '',
  });

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly detail = signal<OpenRequestDetailModel | null>(null);
  protected readonly sent = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sent.set(true);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'No se pudo enviar la propuesta.';
          this.errorMessage.set(msg);
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
    this.state.set('loading');

    this.openRequests
      .getOpenRequestDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.detail.set(d);
          this.state.set('success');
        },
        error: () => {
          this.detail.set(null);
          this.state.set('error');
        },
      });
  }
}

