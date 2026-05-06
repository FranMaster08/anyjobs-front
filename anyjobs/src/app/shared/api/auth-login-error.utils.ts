import { HttpErrorResponse } from '@angular/common/http';

/** Claves i18n — mensajes seguros (sin enumeración de usuarios). */
export const AUTH_I18N_LOGIN_FAILED = 'auth.loginFailed';
export const AUTH_I18N_LOGIN_NETWORK = 'auth.loginNetworkError';
export const AUTH_I18N_LOGIN_UNAVAILABLE = 'auth.loginUnavailable';

/**
 * Mapea fallos del flujo de login a un mensaje seguro para el usuario.
 * No propaga textos del backend que puedan revelar si falló el usuario o la contraseña.
 */
export function mapLoginErrorToMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof HttpErrorResponse) {
    const status = err.status;
    if (status === 0) return t(AUTH_I18N_LOGIN_NETWORK);
    if (status >= 500) return t(AUTH_I18N_LOGIN_UNAVAILABLE);
    if (status >= 400 && status < 500) return t(AUTH_I18N_LOGIN_FAILED);
    return t(AUTH_I18N_LOGIN_FAILED);
  }
  if (err instanceof Error) return t(AUTH_I18N_LOGIN_FAILED);
  if (typeof err === 'string') return t(AUTH_I18N_LOGIN_FAILED);
  return t(AUTH_I18N_LOGIN_UNAVAILABLE);
}
