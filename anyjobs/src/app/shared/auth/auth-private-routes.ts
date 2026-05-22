/** Rutas que requieren sesión válida (path sin query ni hash). */
export const AUTH_REQUIRED_PATH_PREFIXES = [
  '/perfil',
  '/mis-solicitudes',
  '/solicitudes/nueva',
] as const;

/** Patrones de rutas privadas (propuesta sobre solicitud concreta). */
const AUTH_REQUIRED_PATTERNS: readonly RegExp[] = [
  /^\/solicitudes\/[^/]+\/propuesta\/?$/,
];

export function pathOnlyFromRouterUrl(url: string): string {
  return url.split('?')[0]?.split('#')[0] ?? '';
}

export function requiresAuthenticatedRoute(url: string): boolean {
  const path = pathOnlyFromRouterUrl(url);
  if (AUTH_REQUIRED_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return true;
  }
  return AUTH_REQUIRED_PATTERNS.some((re) => re.test(path));
}
