import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApi } from '../../../shared/api/auth.api';
import { I18nService } from '../../../shared/i18n/i18n.service';
import {
  passwordMatchValidator,
  strongPasswordValidator,
} from './password-recovery.validators';

type ViewMode = 'request' | 'checking' | 'reset' | 'expired' | 'success';

@Component({
  selector: 'app-password-recovery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.scss',
})
export class PasswordRecovery {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApi);
  protected readonly i18n = inject(I18nService);

  protected readonly mode = signal<ViewMode>('request');
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly resetForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, strongPasswordValidator()]],
      passwordConfirm: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('password', 'passwordConfirm') },
  );

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const token = params.get('token')?.trim();
      if (token) {
        this.validateTokenFromUrl(token);
      } else if (this.mode() !== 'success' && this.mode() !== 'expired') {
        this.mode.set('request');
        this.cdr.markForCheck();
      }
    });
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  private validateTokenFromUrl(token: string): void {
    this.mode.set('checking');
    this.errorMessage.set(null);
    this.cdr.markForCheck();

    this.authApi
      .validateResetToken({ token })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.valid) {
            this.mode.set('reset');
            this.cdr.markForCheck();
            return;
          }
          this.showExpiredLink();
        },
        error: () => {
          this.showExpiredLink();
        },
      });
  }

  private showExpiredLink(): void {
    this.mode.set('expired');
    this.errorMessage.set(null);
    void this.router.navigate(['/recuperar-contrasena'], {
      replaceUrl: true,
      queryParams: {},
    });
    this.cdr.markForCheck();
  }

  protected submitRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    if (this.busy()) return;

    this.busy.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authApi
      .forgotPassword({ email: this.requestForm.controls.email.value })
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage.set(this.t('passwordRecovery.requestError'));
          this.cdr.markForCheck();
        },
      });
  }

  protected submitReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    if (this.busy()) return;

    const token = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (!token) {
      this.showExpiredLink();
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);

    this.authApi
      .resetPassword({
        token,
        password: this.resetForm.controls.password.value,
      })
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.mode.set('success');
          void this.router.navigate(['/recuperar-contrasena'], {
            replaceUrl: true,
            queryParams: {},
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.showExpiredLink();
        },
      });
  }

  protected goToLogin(): void {
    void this.router.navigate(['/'], { queryParams: { login: '1' } });
  }

  protected requestNewLink(): void {
    this.mode.set('request');
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.cdr.markForCheck();
  }
}
