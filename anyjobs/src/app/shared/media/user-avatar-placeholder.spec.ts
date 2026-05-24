import {
  buildUserAvatarPlaceholderDataUrl,
  initialsFromDisplayName,
  resolveSlideAvatarUrl,
} from './user-avatar-placeholder';

describe('user-avatar-placeholder', () => {
  it('derives initials from display name', () => {
    expect(initialsFromDisplayName('Fran García')).toBe('FG');
    expect(initialsFromDisplayName('Ana')).toBe('AN');
    expect(initialsFromDisplayName('')).toBe('U');
  });

  it('builds PNG data URL allowed by Angular img[src] sanitizer', () => {
    const url = buildUserAvatarPlaceholderDataUrl('Fran', 96);
    expect(url.startsWith('data:image/png')).toBe(true);
    expect(url).not.toContain('ui-avatars');
    expect(url).not.toContain('image/svg');
  });

  it('resolveSlideAvatarUrl uses placeholder when avatar is empty', () => {
    const url = resolveSlideAvatarUrl('', 'María López');
    expect(url.startsWith('data:image/png')).toBe(true);
  });

  it('resolveSlideAvatarUrl replaces legacy ui-avatars URLs', () => {
    const url = resolveSlideAvatarUrl(
      'https://ui-avatars.com/api/?name=test&size=96',
      'Test User',
    );
    expect(url.startsWith('data:image/png')).toBe(true);
    expect(url).not.toContain('ui-avatars.com');
  });

  it('resolveSlideAvatarUrl keeps real profile photo URLs', () => {
    const real = 'https://cdn.example.com/users/1/avatar.jpg';
    expect(resolveSlideAvatarUrl(real, 'User')).toBe(real);
  });
});
