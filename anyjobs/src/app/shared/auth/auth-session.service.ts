import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';

import { UserApi } from '../api/user.api';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthSession } from './auth.models';
import type { InvalidateSessionOptions, SessionInvalidationReason } from './auth-session.models';
import { requiresAuthenticatedRoute } from './auth-private-routes';

const TOKEN_KEY = 'anyjobs.auth.token';
const USER_KEY = 'anyjobs.auth.user';

function safeRead(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readInitialSession(): AuthSession | null {
  const token = safeRead(TOKEN_KEY);
  const rawUser = safeRead(USER_KEY);
  if (!token || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as AuthSession['user'];
    if (!user?.id || !user?.email) return null;
    return { token, user };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApi);
  private readonly notifications = inject(NotificationsService);

  private readonly session = signal<AuthSession | null>(readInitialSession());
  /** false hasta validar token persistido con el backend (si hay sesión al boot). */
  private readonly sessionValidated = signal(readInitialSession() === null);
  private readonly authBlocked = signal(false);
  private readonly sessionExpiredNotice = signal(false);
  private invalidationInFlight = false;

  readonly vm = computed(() => {
    const s = this.session();
    const validated = this.sessionValidated();
    const blocked = this.authBlocked();
    return {
      session: s,
      isLoggedIn: Boolean(s?.token) && validated && !blocked,
      user: s?.user ?? null,
    };
  });

  readonly isAuthBlocked = computed(() => this.authBlocked());

  setSession(next: AuthSession): void {
    this.authBlocked.set(false);
    this.invalidationInFlight = false;
    this.sessionExpiredNotice.set(false);
    this.sessionValidated.set(true);
    this.session.set(next);
    safeWrite(TOKEN_KEY, next.token);
    safeWrite(USER_KEY, JSON.stringify(next.user));
  }

  clear(): void {
    this.invalidateSession('logout', { notify: false, redirect: false });
  }

  hasPersistedCredentials(): boolean {
    return Boolean(safeRead(TOKEN_KEY) && safeRead(USER_KEY));
  }

  /**
   * Valida token persistido al arranque. Bloquea `isLoggedIn` hasta completar.
   */
  validatePersistedSession(): Promise<void> {
    const current = this.session();
    if (!current?.token) {
      this.sessionValidated.set(true);
      return Promise.resolve();
    }

    this.sessionValidated.set(false);

    return firstValueFrom(
      this.userApi.getMyProfile().pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            this.invalidateSession('expired', {
              redirect: requiresAuthenticatedRoute(this.router.url),
              notify: false,
            });
          }
          return of(null);
        }),
      ),
    ).then(() => {
      if (this.session()) {
        this.sessionValidated.set(true);
      }
    });
  }

  invalidateSession(
    reason: SessionInvalidationReason,
    options: InvalidateSessionOptions = {},
  ): void {
    if (this.invalidationInFlight && reason !== 'logout') return;
    if (reason !== 'logout') this.invalidationInFlight = true;

    this.authBlocked.set(true);
    this.session.set(null);
    this.sessionValidated.set(true);
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
    this.notifications.reset();

    const notify = options.notify ?? reason !== 'logout';
    if (notify && (reason === 'expired' || reason === 'invalid')) {
      this.sessionExpiredNotice.set(true);
    }

    const shouldRedirect = options.redirect ?? true;
    if (shouldRedirect && requiresAuthenticatedRoute(this.router.url)) {
      void this.router.navigate(['/home'], {
        queryParams: { login: 1 },
        queryParamsHandling: 'merge',
      });
    }

    queueMicrotask(() => {
      this.invalidationInFlight = false;
    });
  }

  consumeSessionExpiredNotice(): boolean {
    if (!this.sessionExpiredNotice()) return false;
    this.sessionExpiredNotice.set(false);
    return true;
  }
}
