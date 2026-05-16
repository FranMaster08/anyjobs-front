/**
 * El avatar del reel vive dentro de ngx-vertical-slider; enlazamos por delegación de clic.
 */
export function setupSliderAvatarProfileNavigation(
  container: HTMLElement,
  resolveOwnerUserId: (slideIndex: number) => string | null | undefined,
  navigateToProfile: (userId: string) => void,
): () => void {
  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const avatar = target.closest('.slide__avatar');
    if (!avatar) return;
    if (target.closest('media-follow-button')) return;

    const slideEl = avatar.closest('media-slide');
    if (!slideEl) return;

    const slideNodes = container.querySelectorAll('media-slide');
    const index = Array.from(slideNodes).indexOf(slideEl);
    if (index < 0) return;

    const userId = resolveOwnerUserId(index)?.trim();
    if (!userId) return;

    event.preventDefault();
    event.stopPropagation();
    navigateToProfile(userId);
  };

  container.addEventListener('click', onClick);
  return () => container.removeEventListener('click', onClick);
}
