export type SessionInvalidationReason = 'expired' | 'invalid' | 'logout';

export interface InvalidateSessionOptions {
  /** Si false, no redirige aunque la ruta sea privada. Por defecto true. */
  redirect?: boolean;
  /** Si false, no marca aviso de sesión expirada. Por defecto true salvo logout. */
  notify?: boolean;
}
