/**
 * Destino de perfil alineado con el shell: público por `userId` si hay sesión, si no `/perfil`.
 */
export function buildProfileRouterLink(userId: string | undefined | null): readonly string[] {
  const id = userId?.trim();
  if (id) return ['/usuarios', id];
  return ['/perfil'];
}
