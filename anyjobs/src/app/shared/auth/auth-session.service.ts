import { Injectable, computed, signal } from '@angular/core';

import { AuthSession } from './auth.models';

const TOKEN_KEY = 'anyjobs.auth.token';
const USER_KEY = 'anyjobs.auth.user';

function safeRead(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // ignore
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
  private readonly session = signal<AuthSession | null>(readInitialSession());

  readonly vm = computed(() => {
    const s = this.session();
    return {
      session: s,
      isLoggedIn: Boolean(s?.token),
      user: s?.user ?? null,
    };
  });

  setSession(next: AuthSession): void {
    this.session.set(next);
    safeWrite(TOKEN_KEY, next.token);
    safeWrite(USER_KEY, JSON.stringify(next.user));
  }

  clear(): void {
    this.session.set(null);
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
  }
}

