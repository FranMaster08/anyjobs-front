import { HttpErrorResponse } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AUTH_I18N_LOGIN_FAILED,
  AUTH_I18N_LOGIN_NETWORK,
  AUTH_I18N_LOGIN_UNAVAILABLE,
  mapLoginErrorToMessage,
} from './auth-login-error.utils';

describe('mapLoginErrorToMessage', () => {
  const t = vi.fn((key: string) => `t:${key}`);

  beforeEach(() => {
    t.mockClear();
  });

  it('maps 401 to login failed key', () => {
    const msg = mapLoginErrorToMessage(
      new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }),
      t,
    );
    expect(msg).toBe(`t:${AUTH_I18N_LOGIN_FAILED}`);
  });

  it('maps status 0 to network key', () => {
    const msg = mapLoginErrorToMessage(new HttpErrorResponse({ status: 0 }), t);
    expect(msg).toBe(`t:${AUTH_I18N_LOGIN_NETWORK}`);
  });

  it('maps 5xx to unavailable key', () => {
    const msg = mapLoginErrorToMessage(new HttpErrorResponse({ status: 503 }), t);
    expect(msg).toBe(`t:${AUTH_I18N_LOGIN_UNAVAILABLE}`);
  });

  it('maps Error (mock/offline handlers) to login failed key', () => {
    expect(mapLoginErrorToMessage(new Error('Credenciales inválidas'), t)).toBe(
      `t:${AUTH_I18N_LOGIN_FAILED}`,
    );
  });

  it('maps unknown shapes to unavailable key', () => {
    expect(mapLoginErrorToMessage({ foo: 'bar' }, t)).toBe(`t:${AUTH_I18N_LOGIN_UNAVAILABLE}`);
  });
});
