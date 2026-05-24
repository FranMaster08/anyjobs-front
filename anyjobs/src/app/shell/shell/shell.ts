import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, exhaustMap, filter, EMPTY, finalize, Subject } from 'rxjs';

import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteConfigService } from '../../shared/site-config/site-config.service';
import { ModalComponent } from '../../components/modal/modal';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field';
import { AuthApi } from '../../shared/api/auth.api';
import { mapLoginErrorToMessage } from '../../shared/api/auth-login-error.utils';
import { LoginRequest } from '../../shared/api/auth.models';
import { AuthSessionService } from '../../shared/auth/auth-session.service';
import { buildProfileRouterLink } from '../../shared/navigation/profile-router-link';
import { HeaderNotificationsBellComponent } from '../header-notifications-bell/header-notifications-bell';
import { HeaderOpenRequestsFiltersToggleComponent } from '../header-open-requests-filters-toggle/header-open-requests-filters-toggle';
import { OpenRequestsFiltersUiService } from '../../features/open-requests/open-requests-filters-ui.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import {
  isImmersiveMediaPath,
  isOpenRequestsLandingPath,
  pathOnlyFromUrl,
} from '../../features/open-requests/open-requests-navigation';

/** Breakpoint alineado con `shell.scss` (cabecera compacta ≤900px). */
export const SHELL_HEADER_COMPACT_MAX_PX = 900;

/** Selector de idioma en cabecera (desktop y drawer móvil). */
export const SHELL_SHOW_LANGUAGE_SELECTOR = false;

/** CTA «publicar / ver más» en el drawer del menú móvil. */
export const SHELL_SHOW_MOBILE_PUBLISH_CTA = false;

export interface ShellMainNavItem {
  i18nKey: string;
  routerLink: readonly string[];
  /** Ancla en la landing de solicitudes; scroll sin `fragment` en la URL. */
  scrollTarget?: string;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    ModalComponent,
    PasswordFieldComponent,
    HeaderNotificationsBellComponent,
    HeaderOpenRequestsFiltersToggleComponent,
  ],
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
  private readonly notifications = inject(NotificationsService);
  private readonly openRequestsFiltersUi = inject(OpenRequestsFiltersUiService);
  private readonly loginRequests = new Subject<LoginRequest>();

  protected readonly t = (key: string) => this.i18n.t(key);
  protected readonly authVm = this.auth.vm;

  protected profileRouterLink(): readonly string[] {
    return buildProfileRouterLink(this.authVm().user?.id);
  }

  protected readonly isLoginOpen = signal(false);
  protected readonly loginBusy = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly sessionExpiredBanner = signal<string | null>(null);
  protected readonly isAccountMenuOpen = signal(false);
  protected readonly isMobileNavOpen = signal(false);
  protected readonly showLanguageSelector = SHELL_SHOW_LANGUAGE_SELECTOR;
  protected readonly showMobilePublishCta = SHELL_SHOW_MOBILE_PUBLISH_CTA;
  protected readonly showOpenRequestsFiltersInHeader = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  private fragmentScrollHandle: ReturnType<typeof setTimeout> | null = null;
  private pendingScrollTarget: string | null = null;

  /** Una sola fuente de verdad para desktop y panel móvil. */
  protected readonly mainNavItems: readonly ShellMainNavItem[] = [
    { i18nKey: 'nav.inicio', routerLink: ['/home'] },
    { i18nKey: 'nav.solicitudes', routerLink: ['/solicitudes'], scrollTarget: 'solicitudes' },
    { i18nKey: 'nav.ubicacion', routerLink: ['/solicitudes'], scrollTarget: 'ubicacion' },
    { i18nKey: 'nav.contacto', routerLink: ['/solicitudes'], scrollTarget: 'contacto' },
  ] as const;

  protected readonly loginForm = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(4)]),
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearFragmentScrollSchedule());
    this.updateOpenRequestsFiltersHeaderVisibility();
    this.site.load();

    effect(() => {
      if (!this.auth.consumeSessionExpiredNotice()) return;
      this.sessionExpiredBanner.set(this.i18n.t('auth.sessionExpired'));
      this.cdr.markForCheck();
    });

    effect(() => {
      if (this.authVm().isLoggedIn) {
        this.notifications.refreshUnreadCount();
        this.sessionExpiredBanner.set(null);
      }
    });

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
          this.sessionExpiredBanner.set(null);
          this.notifications.refreshUnreadCount();
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
        this.clearFragmentScrollSchedule();
        this.isAccountMenuOpen.set(false);
        this.isMobileNavOpen.set(false);
        this.updateOpenRequestsFiltersHeaderVisibility();
        const urlTree = this.router.parseUrl(this.router.url);
        const fragment = urlTree.fragment;
        const pathOnly = pathOnlyFromUrl(this.router.url);

        const loginParam = urlTree.queryParams?.['login'];
        if (String(loginParam) === '1') {
          this.openLogin();
          this.router.navigate([], {
            queryParams: { login: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }

        if (fragment === 'contacto') {
          if (isImmersiveMediaPath(pathOnly)) {
            void this.router.navigateByUrl('/solicitudes').then(() => {
              this.scheduleScrollToFragment('contacto');
            });
            return;
          }
          this.scheduleScrollToFragment('contacto');
          return;
        }

        if (fragment && isOpenRequestsLandingPath(pathOnly)) {
          // Los anclas de `/solicitudes` viven dentro del *ngSwitch* de la landing y solo
          // existen tras `success`; un solo `setTimeout(0)` corre demasiado pronto.
          this.scheduleScrollToFragment(fragment);
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

  private clearFragmentScrollSchedule(): void {
    if (this.fragmentScrollHandle !== null) {
      clearTimeout(this.fragmentScrollHandle);
      this.fragmentScrollHandle = null;
    }
    this.pendingScrollTarget = null;
  }

  /**
   * Reintenta hasta que el ancla exista en el DOM (p. ej. landing async) o hasta timeout.
   * No depende del fragmento en la URL (evita `#solicitudes` al navegar al detalle).
   */
  private scheduleScrollToFragment(fragment: string): void {
    this.clearFragmentScrollSchedule();
    this.pendingScrollTarget = fragment;
    const deadline = Date.now() + 6000;
    const stepMs = 48;

    const tick = (): void => {
      if (this.pendingScrollTarget !== fragment) {
        this.clearFragmentScrollSchedule();
        return;
      }
      const el = document.getElementById(fragment);
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        this.clearFragmentScrollSchedule();
        return;
      }
      if (Date.now() >= deadline) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        this.clearFragmentScrollSchedule();
        return;
      }
      this.fragmentScrollHandle = setTimeout(tick, stepMs);
    };

    this.fragmentScrollHandle = setTimeout(tick, 0);
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
    this.unlockBodyScroll();
  }

  /** Cierra el modal y navega; el scroll del body se restaura aunque la ruta ya sea /registro. */
  /** Navega a la landing de solicitudes y hace scroll a una sección, sin `#fragment` en la URL. */
  protected scrollToContact(event: Event): void {
    event.preventDefault();
    this.closeMobileNav();
    this.closeAccountMenu();
    this.scrollToFooterContact();
  }

  private scrollToFooterContact(): void {
    if (isImmersiveMediaPath(pathOnlyFromUrl(this.router.url))) {
      void this.router.navigateByUrl('/solicitudes').then(() => {
        this.scheduleScrollToFragment('contacto');
      });
      return;
    }
    this.scheduleScrollToFragment('contacto');
  }

  protected scrollToOpenRequestsSection(event: Event, sectionId: string): void {
    event.preventDefault();
    this.closeMobileNav();
    this.closeAccountMenu();

    const target = sectionId.trim();
    if (!target) return;

    if (target === 'contacto') {
      this.scrollToFooterContact();
      return;
    }

    if (isOpenRequestsLandingPath(pathOnlyFromUrl(this.router.url))) {
      this.scheduleScrollToFragment(target);
      return;
    }

    void this.router.navigateByUrl('/solicitudes').then(() => {
      this.scheduleScrollToFragment(target);
    });
  }

  protected goToRegistration(event: Event): void {
    event.preventDefault();
    this.closeLogin();
    this.closeMobileNav();
    void this.router.navigateByUrl('/registro').then(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }

  private unlockBodyScroll(): void {
    try {
      document.body.style.overflow = '';
    } catch {
      // ignore
    }
  }

  protected toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((v) => !v);
  }

  protected closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

  private updateOpenRequestsFiltersHeaderVisibility(): void {
    const path = this.router.url.split('?')[0]?.split('#')[0] ?? '';
    const onLanding = path === '/solicitudes';
    this.showOpenRequestsFiltersInHeader.set(onLanding);
    if (!onLanding) {
      this.openRequestsFiltersUi.close();
    }
    this.cdr.markForCheck();
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
    this.sessionExpiredBanner.set(null);
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
