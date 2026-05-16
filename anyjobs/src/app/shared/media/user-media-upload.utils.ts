/** Debe coincidir con `USER_MEDIA_MAX_BYTES` del backend. */
export const USER_MEDIA_MAX_BYTES = 50 * 1024 * 1024;

const EXTENSION_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const ALLOWED_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function formatFileSizeMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

export function resolveUploadMimeType(file: File): string | null {
  const fromBrowser = file.type?.trim().toLowerCase();
  if (fromBrowser && ALLOWED_MIMES.has(fromBrowser)) {
    return fromBrowser;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const fromExt = EXTENSION_MIME[ext];
  return fromExt && ALLOWED_MIMES.has(fromExt) ? fromExt : null;
}

export function isUploadFileTooLarge(bytes: number): boolean {
  return bytes > USER_MEDIA_MAX_BYTES;
}
