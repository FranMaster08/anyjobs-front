import { HttpErrorResponse } from '@angular/common/http';

import {
  isAuthenticationFailureResponse,
  shouldSkipSessionExpirationHandling,
} from './auth-unauthorized.utils';

describe('auth-unauthorized.utils', () => {
  it('skips login endpoint', () => {
    expect(shouldSkipSessionExpirationHandling('http://localhost/auth/login')).toBe(true);
    expect(shouldSkipSessionExpirationHandling('http://localhost/api/auth/login')).toBe(true);
  });

  it('does not skip protected users endpoint', () => {
    expect(shouldSkipSessionExpirationHandling('http://localhost/users/me/profile')).toBe(false);
  });

  it('detects AUTH error codes on 401', () => {
    const err = new HttpErrorResponse({
      status: 401,
      error: { errorCode: 'AUTH.UNAUTHORIZED', message: 'No autenticado.' },
    });
    expect(isAuthenticationFailureResponse(err)).toBe(true);
  });

  it('treats plain 401 as auth failure when no errorCode', () => {
    const err = new HttpErrorResponse({ status: 401, error: { message: 'No autenticado.' } });
    expect(isAuthenticationFailureResponse(err)).toBe(true);
  });

  it('ignores non-401 responses', () => {
    const err = new HttpErrorResponse({ status: 403 });
    expect(isAuthenticationFailureResponse(err)).toBe(false);
  });
});
