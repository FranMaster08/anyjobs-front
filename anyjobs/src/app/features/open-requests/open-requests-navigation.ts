import { Router, UrlTree } from '@angular/router';

const DETAIL_PATH_RE = /^\/solicitudes\/([^/]+)$/;
const RESERVED_SOLICITUDES_SEGMENTS = new Set(['nueva']);

export function pathOnlyFromUrl(url: string): string {
  return (url.split('?')[0]?.split('#')[0] ?? '').replace(/\/+$/, '') || '/';
}

export function openRequestDetailTree(router: Router, openRequestId: string): UrlTree | null {
  const id = openRequestId?.trim();
  if (!id) return null;
  return router.createUrlTree(['/solicitudes', id]);
}

export function openRequestDetailPath(openRequestId: string): string {
  const id = openRequestId?.trim();
  return id ? `/solicitudes/${encodeURIComponent(id)}` : '/solicitudes';
}

export function isOpenRequestsLandingPath(path: string): boolean {
  return pathOnlyFromUrl(path) === '/solicitudes';
}

/** Rutas con visor de reels a pantalla completa (sin footer de contacto). */
export function isImmersiveMediaPath(path: string): boolean {
  const normalized = pathOnlyFromUrl(path);
  return normalized === '/home' || normalized === '/reels';
}

export function isOpenRequestDetailPath(path: string): boolean {
  const normalized = pathOnlyFromUrl(path);
  const match = normalized.match(DETAIL_PATH_RE);
  if (!match) return false;
  return !RESERVED_SOLICITUDES_SEGMENTS.has(match[1]!);
}

/**
 * Navegación al detalle sin fragmentos (#solicitudes).
 * Si el router no actualiza la URL, fuerza `location.assign` (recuperación ante estado inconsistente).
 */
export function navigateToOpenRequestDetail(router: Router, openRequestId: string): Promise<boolean> {
  const id = openRequestId?.trim();
  if (!id) return Promise.resolve(false);

  const targetPath = openRequestDetailPath(id);
  if (pathOnlyFromUrl(router.url) === targetPath) {
    return Promise.resolve(true);
  }

  const tree = openRequestDetailTree(router, id);
  if (!tree) return Promise.resolve(false);
  tree.fragment = null;

  return router.navigateByUrl(tree, { replaceUrl: false }).then((ok) => {
    requestAnimationFrame(() => {
      if (pathOnlyFromUrl(router.url) !== targetPath) {
        globalThis.location.assign(targetPath);
        return;
      }
      globalThis.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return ok;
  });
}
