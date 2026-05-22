import type { ReelSlide } from './feed-reels-slide';

export function reelSlideKey(slide: ReelSlide): string {
  return slide.id?.trim() || slide.media?.trim() || '';
}

/** Slide con URL de media usable en la galería o el slider. */
export function isDisplayableReelSlide(slide: ReelSlide | null | undefined): boolean {
  if (!slide) return false;

  const media = slide.media?.trim() ?? '';
  if (media.length === 0) return false;

  return slide.type === 'video' || slide.type === 'image';
}

export function filterDisplayableReelSlides(slides: readonly ReelSlide[]): ReelSlide[] {
  return slides.filter(isDisplayableReelSlide);
}
