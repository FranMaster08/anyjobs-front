import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, exhaustMap, filter, EMPTY, finalize, Subject } from 'rxjs';

import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteConfigService } from '../../shared/site-config/site-config.service';
import { ModalComponent } from '../../components/modal/modal';
import { AuthApi } from '../../shared/api/auth.api';
import { mapLoginErrorToMessage } from '../../shared/api/auth-login-error.utils';
import { LoginRequest } from '../../shared/api/auth.models';
import { AuthSessionService } from '../../shared/auth/auth-session.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, ReactiveFormsModule, ModalComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);
  protected readonly site = inject(SiteConfigService);
  private readonly authApi = inject(AuthApi);
  protected readonly auth = inject(AuthSessionService);
  private readonly loginRequests = new Subject<LoginRequest>();

  protected readonly t = (key: string) => this.i18n.t(key);
  protected readonly authVm = this.auth.vm;

  protected readonly isLoginOpen = signal(false);
  protected readonly loginBusy = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly isAccountMenuOpen = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(4)]),
  });

  constructor() {
    this.site.load();

    this.loginRequests
      .pipe(
        exhaustMap((creds) => {
          this.loginBusy.set(true);
          this.loginError.set(null);
          return this.authApi.login(creds).pipe(
            finalize(() => this.loginBusy.set(false)),
            catchError((err: unknown) => {
              const msg = mapLoginErrorToMessage(err, (key) => this.i18n.t(key));
              this.loginError.set(msg);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.auth.setSession({ token: res.token, user: res.user });
          this.isLoginOpen.set(false);
          this.isAccountMenuOpen.set(false);
          this.loginForm.reset({ email: '', password: '' });
          this.cdr.markForCheck();
        },
      });

    // Router scroll behavior:
    // - If URL has fragment: scroll to anchor (if present)
    // - Else: scroll to top
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.isAccountMenuOpen.set(false);
        const urlTree = this.router.parseUrl(this.router.url);
        const fragment = urlTree.fragment;

        const loginParam = urlTree.queryParams?.['login'];
        if (String(loginParam) === '1') {
          this.openLogin();
          this.router.navigate([], {
            queryParams: { login: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }

        if (fragment) {
          // Wait one tick so the target element can render after route navigation.
          setTimeout(() => {
            const el = document.getElementById(fragment);
            if (el) {
              el.scrollIntoView({ block: 'start', behavior: 'smooth' });
              return;
            }
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          }, 0);
          return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
  }

  protected onLangChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? 'es';
    if (value === 'es' || value === 'en') {
      this.i18n.setLang(value);
    }
  }

  protected openLogin(): void {
    this.loginError.set(null);
    this.isLoginOpen.set(true);
  }

  protected closeLogin(): void {
    this.isLoginOpen.set(false);
  }

  protected toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((v) => !v);
  }

  protected closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

  protected logout(): void {
    this.isAccountMenuOpen.set(false);
    this.auth.clear();
    this.router.navigateByUrl('/home');
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    if (this.loginBusy()) return;

    this.loginRequests.next(this.loginForm.getRawValue());
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.isAccountMenuOpen()) this.isAccountMenuOpen.set(false);
      if (this.isLoginOpen()) this.isLoginOpen.set(false);
    }
  }
}
