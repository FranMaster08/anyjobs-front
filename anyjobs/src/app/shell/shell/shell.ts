import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, finalize } from 'rxjs';

import { AppLang, I18nService } from '../../shared/i18n/i18n.service';
import { SiteConfigService } from '../../shared/site-config/site-config.service';
import { ModalComponent } from '../../components/modal/modal';
import { AuthApi } from '../../shared/api/auth.api';
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
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);
  protected readonly site = inject(SiteConfigService);
  private readonly authApi = inject(AuthApi);
  protected readonly auth = inject(AuthSessionService);

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
          this.router.navigate([], { queryParams: { login: null }, queryParamsHandling: 'merge', replaceUrl: true });
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

    const value = this.loginForm.getRawValue();
    this.loginBusy.set(true);
    this.loginError.set(null);

    this.authApi
      .login(value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loginBusy.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.auth.setSession({ token: res.token, user: res.user });
          this.isLoginOpen.set(false);
          this.isAccountMenuOpen.set(false);
          this.loginForm.reset({ email: '', password: '' });
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error inesperado';
          this.loginError.set(msg);
        },
      });
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.isAccountMenuOpen()) this.isAccountMenuOpen.set(false);
      if (this.isLoginOpen()) this.isLoginOpen.set(false);
    }
  }
}
