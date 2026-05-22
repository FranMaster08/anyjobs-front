/** Colores alineados a tokens globales (`--aj-color-chip`, `--aj-color-primary`). */
const PLACEHOLDER_BG = 'eef2f3';
const PLACEHOLDER_FG = '0ea5a4';

export function buildUserAvatarPlaceholderUrl(displayName: string, size = 96): string {
  const name = displayName.trim() || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${PLACEHOLDER_BG}&color=${PLACEHOLDER_FG}`;
}

/** Sustituye placeholders ui-avatars (p. ej. legacy fe2c55 del API) por colores del producto. */
export function resolveSlideAvatarUrl(
  avatar: string | undefined | null,
  displayName: string,
  size = 96,
): string {
  const trimmed = avatar?.trim() ?? '';
  if (!trimmed) {
    return buildUserAvatarPlaceholderUrl(displayName, size);
  }
  if (/ui-avatars\.com\/api\//i.test(trimmed)) {
    return buildUserAvatarPlaceholderUrl(displayName, size);
  }
  return trimmed;
}
