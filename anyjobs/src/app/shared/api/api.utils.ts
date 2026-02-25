export function createMockId(prefix = 'u'): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}_${uuid}`;
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

