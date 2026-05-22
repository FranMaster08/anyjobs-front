import { HttpErrorResponse } from '@angular/common/http';

const AUTH_SKIP_PATH_PATTERNS: readonly RegExp[] = [
  /\/auth\/login\/?$/i,
  /\/auth\/register\/?$/i,
  /\/auth\/forgot-password\/?$/i,
  /\/auth\/reset-password\/?$/i,
  /\/auth\/email-available/i,
  /\/auth\/phone-available/i,
  /\/auth\/verify-email/i,
  /\/auth\/verify-phone/i,
];

export function shouldSkipSessionExpirationHandling(requestUrl: string): boolean {
  try {
    const path = new URL(requestUrl, 'http://local').pathname;
    const normalized =
      path === '/api' ? '/' : path.startsWith('/api/') ? path.slice('/api'.length) : path;
    return AUTH_SKIP_PATH_PATTERNS.some((re) => re.test(normalized));
  } catch {
    return false;
  }
}

export function isAuthenticationFailureResponse(error: HttpErrorResponse): boolean {
  if (error.status !== 401) return false;

  const body = error.error;
  if (body && typeof body === 'object' && body !== null && 'errorCode' in body) {
    const code = (body as { errorCode?: unknown }).errorCode;
    return typeof code === 'string' && code.startsWith('AUTH.');
  }

  return true;
}
