import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { AuthSessionService } from '../auth/auth-session.service';
import { AUTH_API_URL } from './auth.api';
import { USERS_API_URL } from './user.api';
import { OPEN_REQUESTS_API_URL } from '../../features/open-requests/open-requests.service';
import { PROPOSALS_API_URL } from '../proposals/proposals.service';
import { SITE_CONFIG_URL } from '../site-config/site-config.service';

const API_PREFIXES = ['/auth', '/users', '/open-requests', '/proposals', '/site-config'] as const;

function normalizePathname(pathname: string): string {
  // Backend puede exponer los endpoints bajo un prefijo tipo "/api".
  if (pathname === '/api') return '/';
  if (pathname.startsWith('/api/')) return pathname.slice('/api'.length);
  return pathname;
}

export const authBearerInterceptor: HttpInterceptorFn = (req, next) => {
  // `HttpRequest.url` puede venir absoluto o relativo.
  const doc = inject(DOCUMENT);
  let resolved: URL | null = null;
  try {
    resolved = new URL(req.url, doc.baseURI);
  } catch {
    resolved = null;
  }

  if (!resolved) return next(req);

  const allowedOrigins = new Set<string>([
    new URL(doc.baseURI).origin,
    new URL(inject(AUTH_API_URL)).origin,
    new URL(inject(USERS_API_URL)).origin,
    new URL(inject(OPEN_REQUESTS_API_URL)).origin,
    new URL(inject(PROPOSALS_API_URL)).origin,
    new URL(inject(SITE_CONFIG_URL)).origin,
  ]);

  if (!allowedOrigins.has(resolved.origin)) return next(req);

  const path = normalizePathname(resolved.pathname);
  const isApiPath = API_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isApiPath) return next(req);
  if (req.headers.has('Authorization')) return next(req);

  const token = inject(AuthSessionService).vm().session?.token ?? '';
  if (token.trim().length === 0) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

