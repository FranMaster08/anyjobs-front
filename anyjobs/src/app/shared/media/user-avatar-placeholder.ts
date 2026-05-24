/** Colores alineados a tokens globales (`--aj-color-chip`, `--aj-color-primary`). */
const PLACEHOLDER_BG = '#eef2f3';
const PLACEHOLDER_FG = '#0ea5a4';

const UI_AVATARS_PATTERN = /ui-avatars\.com\/api\//i;

/** PNG 1×1 mínimo (fallback en tests / SSR sin canvas). */
const FALLBACK_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/PwAFgwJ/ljQ3pgAAAABJRU5ErkJggg==';

export function initialsFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function drawPlaceholderOnCanvas(displayName: string, size: number): string | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const initials = initialsFromDisplayName(displayName.trim() || 'Usuario');

  ctx.fillStyle = PLACEHOLDER_BG;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = PLACEHOLDER_FG;
  ctx.font = `600 ${Math.round(size * 0.38)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Placeholder local en PNG (Angular sanitiza `data:image/svg+xml` en `<img>`).
 * Sin peticiones a ui-avatars ni otros dominios de terceros.
 */
export function buildUserAvatarPlaceholderDataUrl(displayName: string, size = 96): string {
  return drawPlaceholderOnCanvas(displayName, size) ?? FALLBACK_PNG_DATA_URL;
}

/** @deprecated Usar {@link buildUserAvatarPlaceholderDataUrl}. */
export function buildUserAvatarPlaceholderUrl(displayName: string, size = 96): string {
  return buildUserAvatarPlaceholderDataUrl(displayName, size);
}

/** Resuelve avatar de slide: foto real o placeholder PNG local. */
export function resolveSlideAvatarUrl(
  avatar: string | undefined | null,
  displayName: string,
  size = 96,
): string {
  const trimmed = avatar?.trim() ?? '';
  if (!trimmed || UI_AVATARS_PATTERN.test(trimmed)) {
    return buildUserAvatarPlaceholderDataUrl(displayName, size);
  }
  return trimmed;
}
