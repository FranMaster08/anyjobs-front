import type { MediaSliderComponent } from 'ngx-vertical-slider';

interface SliderMuteState { muted: { set(value: boolean): void } }

/** ngx-vertical-slider inicia con `muted=true`; no expone input para cambiarlo. */
export function setMediaSliderMuted(slider: MediaSliderComponent | undefined, muted: boolean): void {
  if (!slider) return;
  (slider as unknown as SliderMuteState).muted.set(muted);
}

function forEachSliderVideo(
  root: ParentNode,
  fn: (video: HTMLVideoElement, slideEl: Element | null) => void,
): void {
  root.querySelectorAll('media-slide').forEach((slideEl) => {
    const video = slideEl.querySelector('video.slide__media');
    if (video instanceof HTMLVideoElement) {
      fn(video, slideEl);
    }
  });
}

export function hardStopVideo(video: HTMLVideoElement): void {
  video.pause();
  video.muted = true;
  try {
    video.currentTime = 0;
  } catch {
    // ignore seek while loading
  }
  video.removeAttribute('src');
  video.src = '';
  video.load();
}

/** Pausa todos los vídeos del documento sin vaciar `src` (evita pantallas negras al volver). */
export function pauseAllDocumentVideos(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('video').forEach((node) => {
    if (!(node instanceof HTMLVideoElement)) return;
    node.pause();
    node.muted = true;
  });
}

/** Pausa y vacía `src`; solo al desmontar un slider concreto. */
export function hardStopAllVideos(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('video').forEach((node) => {
    if (node instanceof HTMLVideoElement) hardStopVideo(node);
  });
}

/** Detiene vídeos solo dentro de un contenedor (p. ej. visor fullscreen), sin tocar la grilla. */
export function hardStopVideosIn(root: ParentNode | null | undefined): void {
  if (!root) return;
  root.querySelectorAll('video').forEach((node) => {
    if (node instanceof HTMLVideoElement) hardStopVideo(node);
  });
}

export function pauseAllSliderVideos(container: HTMLElement, resetTime = false): void {
  forEachSliderVideo(container, (video) => {
    video.pause();
    video.muted = true;
    if (resetTime) {
      try {
        video.currentTime = 0;
      } catch {
        // ignore seek errors while metadata loads
      }
    }
  });
}

/** Pausa todos los slides excepto el visible; reproduce solo el visible. */
export function pauseAllVideosExceptVisible(container: HTMLElement, withSound: boolean): void {
  forEachSliderVideo(container, (video) => {
    video.pause();
    video.muted = true;
  });

  let visibleVideo: HTMLVideoElement | null = null;

  forEachSliderVideo(container, (_video, slideEl) => {
    const isVisible = slideEl?.classList.contains('is-visible') ?? false;
    if (!isVisible) return;

    const video = slideEl?.querySelector('video.slide__media');
    if (video instanceof HTMLVideoElement) {
      visibleVideo = video;
    }
  });

  if (!visibleVideo) {
    const fallbackSlide =
      container.querySelector('media-slide.is-visible') ?? container.querySelector('media-slide');
    const fallback = fallbackSlide?.querySelector('video.slide__media');
    if (fallback instanceof HTMLVideoElement) {
      visibleVideo = fallback;
    }
  }

  if (!visibleVideo) return;

  const mediaSrc = visibleVideo.getAttribute('src')?.trim() ?? '';
  if (visibleVideo.error && mediaSrc) {
    visibleVideo.load();
  }

  visibleVideo.muted = !withSound;
  visibleVideo.preload = 'auto';
  void visibleVideo.play().catch(() => undefined);
}

export function syncVisibleSlidePlayback(
  container: HTMLElement,
  slider: MediaSliderComponent | undefined,
  withSound = true,
): void {
  setMediaSliderMuted(slider, !withSound);
  pauseAllVideosExceptVisible(container, withSound);
}

/** Repone `src` en vídeos del slider vaciados por un stop duro previo. */
export function restoreSliderVideoSources(
  container: HTMLElement,
  slides: readonly { readonly media?: string; readonly type?: string }[],
): void {
  const slideEls = container.querySelectorAll('media-slide');
  slideEls.forEach((slideEl, index) => {
    const slide = slides[index];
    const url = slide?.media?.trim() ?? '';
    if (!url || slide?.type !== 'video') return;

    const video = slideEl.querySelector('video.slide__media');
    if (!(video instanceof HTMLVideoElement)) return;
    if (video.getAttribute('src')?.trim()) return;

    video.src = url;
    video.load();
  });
}

export function bootstrapSliderPlayback(
  container: HTMLElement,
  slider: MediaSliderComponent | undefined,
  withSound = true,
  slides: readonly { readonly media?: string; readonly type?: string }[] = [],
): void {
  restoreSliderVideoSources(container, slides);

  const viewport = container.querySelector('.media-slider__viewport');
  if (viewport instanceof HTMLElement) {
    viewport.scrollTop = 0;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => syncVisibleSlidePlayback(container, slider, withSound));
  });
}

type WithSoundOption = boolean | (() => boolean);

function resolveWithSound(option: WithSoundOption): boolean {
  return typeof option === 'function' ? option() : option;
}

/** Sincroniza play/pause mientras el usuario hace scroll (la librería puede dejar varios slides visibles). */
export function setupSliderViewportScrollSync(
  container: HTMLElement,
  slider: MediaSliderComponent | undefined,
  withSound: WithSoundOption,
  registerCleanup: (fn: () => void) => void,
): void {
  const viewport = container.querySelector('.media-slider__viewport');
  if (!(viewport instanceof HTMLElement)) return;

  let rafId = 0;
  const onScroll = (): void => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() =>
      syncVisibleSlidePlayback(container, slider, resolveWithSound(withSound)),
    );
  };

  viewport.addEventListener('scroll', onScroll, { passive: true });
  registerCleanup(() => {
    cancelAnimationFrame(rafId);
    viewport.removeEventListener('scroll', onScroll);
  });
}

export function pauseSliderPlayback(
  container: HTMLElement | undefined,
  slider: MediaSliderComponent | undefined,
  resetTime = false,
): void {
  setMediaSliderMuted(slider, true);
  if (container) pauseAllSliderVideos(container, resetTime);
}

export function destroySliderPlayback(
  container: HTMLElement | undefined,
  slider: MediaSliderComponent | undefined,
): void {
  pauseSliderPlayback(container, slider, true);
  hardStopVideosIn(container);
}

/** Reanuda el slide visible al volver a la pestaña (p. ej. tras `pauseAllDocumentVideos`). */
export function setupDocumentVisibilityPlaybackResume(
  destroyRef: { onDestroy(callback: () => void): void },
  resume: () => void,
): void {
  if (typeof document === 'undefined') return;

  const onVisibility = (): void => {
    if (!document.hidden) resume();
  };

  document.addEventListener('visibilitychange', onVisibility);
  destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisibility));
}

/** @deprecated Usar `destroySliderPlayback` al desmontar o `pauseSliderPlayback` al cambiar slide. */
export function stopSliderPlayback(
  container?: HTMLElement,
  slider?: MediaSliderComponent,
): void {
  destroySliderPlayback(container, slider);
}
