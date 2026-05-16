import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

import {
  hardStopAllVideos,
  pauseAllVideosExceptVisible,
  setMediaSliderMuted,
} from './media-slider-playback';
import type { MediaSliderComponent } from 'ngx-vertical-slider';

/**
 * Pausa todo el vídeo de la página al navegar o al ocultar la pestaña.
 * Evita audio fantasma cuando el slider se desmonta antes de que el componente haga cleanup.
 */
@Injectable({ providedIn: 'root' })
export class MediaPlaybackService {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const router = inject(Router);

    router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.stopAll());

    if (typeof document !== 'undefined') {
      const onVisibility = (): void => {
        if (document.hidden) hardStopAllVideos();
      };
      document.addEventListener('visibilitychange', onVisibility);
      this.destroyRef.onDestroy(() =>
        document.removeEventListener('visibilitychange', onVisibility),
      );
    }
  }

  syncSlider(
    container: HTMLElement,
    withSound: boolean,
    slider?: MediaSliderComponent,
  ): void {
    setMediaSliderMuted(slider, !withSound);
    pauseAllVideosExceptVisible(container, withSound);
  }

  stopAll(): void {
    hardStopAllVideos();
  }
}
