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

/** Breakpoint alineado con `shell.scss` (cabecera compacta ≤900px). */
export const SHELL_HEADER_COMPACT_MAX_PX = 900;

export interface ShellMainNavItem {
  i18nKey: string;
  routerLink: readonly string[];
  fragment?: string;
}

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

  protected profileRouterLink(): readonly string[] {
    const id = this.authVm().user?.id?.trim();
    if (id) return ['/usuarios', id];
    return ['/perfil'];
  }

  protected readonly isLoginOpen = signal(false);
  protected readonly loginBusy = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly isAccountMenuOpen = signal(false);
  protected readonly isMobileNavOpen = signal(false);

  /** Una sola fuente de verdad para desktop y panel móvil (mismas rutas y fragmentos). */
  protected readonly mainNavItems: readonly ShellMainNavItem[] = [
    { i18nKey: 'nav.inicio', routerLink: ['/home'] },
    { i18nKey: 'nav.solicitudes', routerLink: ['/solicitudes'], fragment: 'solicitudes' },
    { i18nKey: 'nav.ubicacion', routerLink: ['/solicitudes'], fragment: 'ubicacion' },
    { i18nKey: 'nav.contacto', routerLink: ['/solicitudes'], fragment: 'contacto' },
  ] as const;

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
          this.isMobileNavOpen.set(false);
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
        this.isMobileNavOpen.set(false);
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

    // Si el panel móvil quedó abierto y el viewport vuelve a escritorio, cerrarlo; si no,
    // `isMobileNavOpen()` sigue true y bloquea el menú de cuenta (`!isMobileNavOpen()` en desktop).
    const mqWide =
      typeof matchMedia !== 'undefined'
        ? matchMedia(`(min-width: ${SHELL_HEADER_COMPACT_MAX_PX + 1}px)`)
        : null;
    if (mqWide) {
      const onWideChange = () => {
        if (mqWide.matches && this.isMobileNavOpen()) {
          this.closeMobileNav();
          this.cdr.markForCheck();
        }
      };
      mqWide.addEventListener('change', onWideChange);
      this.destroyRef.onDestroy(() => mqWide.removeEventListener('change', onWideChange));
      onWideChange();
    }
  }

  protected onLangChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? 'es';
    if (value === 'es' || value === 'en') {
      this.i18n.setLang(value);
    }
  }

  protected openLogin(): void {
    this.closeMobileNav();
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

  protected toggleMobileNav(): void {
    this.isMobileNavOpen.update((open) => {
      const next = !open;
      if (next) {
        this.isAccountMenuOpen.set(false);
      }
      return next;
    });
  }

  protected closeMobileNav(): void {
    this.isAccountMenuOpen.set(false);
    this.isMobileNavOpen.set(false);
  }

  protected logout(): void {
    this.isAccountMenuOpen.set(false);
    this.isMobileNavOpen.set(false);
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
      this.closeMobileNav();
      if (this.isLoginOpen()) this.isLoginOpen.set(false);
    }
  }
}
