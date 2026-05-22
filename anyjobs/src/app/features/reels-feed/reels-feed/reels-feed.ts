import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  runInInjectionContext,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  MediaSliderComponent,
  type SlideActionEvent,
  type SlideFollowEvent,
} from 'ngx-vertical-slider';

import { FeedReelsDataService } from '../../../shared/media/feed-reels-data.service';
import type { ReelSlide } from '../../../shared/media/feed-reels-slide';
import {
  FEED_REELS_SLIDER_ID,
  FeedReelsTelemetryService,
} from '../../../shared/media/feed-reels-telemetry.service';
import { MediaPlaybackService } from '../../../shared/media/media-playback.service';
import {
  bootstrapSliderPlayback,
  destroySliderPlayback,
  pauseSliderPlayback,
  setupSliderViewportScrollSync,
} from '../../../shared/media/media-slider-playback';
import { setupSliderAvatarProfileNavigation } from '../../../shared/media/media-slider-profile-nav';
import { VIEWPORT_DESKTOP_MIN_MQ } from '../../../shared/media/viewport-breakpoint';
import { HomeMobileBottomNavComponent } from '../../home/home-mobile-bottom-nav/home-mobile-bottom-nav';
import { ReelsDesktopGalleryComponent } from '../reels-desktop-gallery/reels-desktop-gallery';

const EARLY_SKIP_MS = 2000;
const WATCH_PROGRESS_INTERVAL_MS = 5000;

@Component({
  selector: 'app-reels-feed',
  imports: [MediaSliderComponent, HomeMobileBottomNavComponent, ReelsDesktopGalleryComponent],
  templateUrl: './reels-feed.html',
  styleUrl: './reels-feed.scss',
})
export class ReelsFeed {
  private readonly feedData = inject(FeedReelsDataService);
  private readonly telemetry = inject(FeedReelsTelemetryService);
  private readonly router = inject(Router);
  private readonly mediaPlayback = inject(MediaPlaybackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly sliderWrap = viewChild<ElementRef<HTMLElement>>('reelsSliderWrap');
  private readonly mediaSlider = viewChild(MediaSliderComponent);

  /** Escritorio: >900px (alineado a `SHELL_HEADER_COMPACT_MAX_PX`). */
  readonly isDesktopViewport = signal(
    typeof matchMedia !== 'undefined' ? matchMedia(VIEWPORT_DESKTOP_MIN_MQ).matches : false,
  );

  readonly loaded = signal(false);
  readonly loadFailed = signal(false);
  readonly slides = signal<readonly ReelSlide[]>([]);

  /** `true` = audio activo; alineado al botón mute de la librería (`withSound = !muted`). */
  private readonly sliderWithSound = signal(true);

  private activeSlideIndex: number | null = null;
  private viewStartedAt: number | null = null;
  private readonly impressionsSent = new Set<number>();
  private visibilityObserver: MutationObserver | null = null;
  private teardownScrollSync: (() => void) | null = null;
  private watchProgressTimer: ReturnType<typeof setInterval> | null = null;
  private teardownAvatarNavigation: (() => void) | null = null;

  constructor() {
    this.feedData
      .loadFeed()
      .pipe(finalize(() => this.loaded.set(true)))
      .subscribe(({ slides, failed }) => {
        this.slides.set(slides);
        this.loadFailed.set(failed);
      });

    if (typeof matchMedia !== 'undefined') {
      const mq = matchMedia(VIEWPORT_DESKTOP_MIN_MQ);
      const onMqChange = (): void => {
        const wasDesktop = this.isDesktopViewport();
        const nowDesktop = mq.matches;
        this.isDesktopViewport.set(nowDesktop);
        if (nowDesktop && !wasDesktop) {
          this.teardownSliderSession();
        }
      };
      mq.addEventListener('change', onMqChange);
      this.destroyRef.onDestroy(() => mq.removeEventListener('change', onMqChange));
    }

    this.destroyRef.onDestroy(() => this.teardownSliderSession());

    effect(() => {
      if (this.isDesktopViewport()) return;
      if (!this.loaded() || this.loadFailed() || this.slides().length === 0) return;
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => {
          this.setupRetentionTracking();
          this.setupAvatarProfileNavigation();
          const wrap = this.sliderWrap()?.nativeElement;
          if (wrap) bootstrapSliderPlayback(wrap, this.mediaSlider(), this.sliderWithSound());
        });
      });
    });
  }

  private syncSliderPlayback(): void {
    const wrap = this.sliderWrap()?.nativeElement;
    if (!wrap) return;
    this.mediaPlayback.syncSlider(wrap, this.sliderWithSound(), this.mediaSlider());
  }

  private setupAvatarProfileNavigation(): void {
    const wrap = this.sliderWrap()?.nativeElement;
    if (!wrap) return;

    this.teardownAvatarNavigation?.();
    this.teardownAvatarNavigation = setupSliderAvatarProfileNavigation(
      wrap,
      (index) => this.slides()[index]?.creatorUserId,
      (userId) => void this.router.navigate(['/usuarios', userId]),
    );
  }

  private setupRetentionTracking(): void {
    const wrap = this.sliderWrap()?.nativeElement;
    if (!wrap || this.visibilityObserver) return;

    const detectVisibleIndex = (): number | null => {
      const slideEls = wrap.querySelectorAll('media-slide');
      for (let i = 0; i < slideEls.length; i++) {
        if (slideEls[i].classList.contains('is-visible')) return i;
      }
      return null;
    };

    const syncPlayback = (): void => {
      this.syncSliderPlayback();
    };

    const onVisibleChange = (): void => {
      requestAnimationFrame(() => {
        const index = detectVisibleIndex();
        syncPlayback();

        if (index === this.activeSlideIndex) return;
        if (this.activeSlideIndex !== null) {
          this.endSlideView(this.activeSlideIndex);
        }
        if (index !== null) {
          this.startSlideView(index);
        } else {
          pauseSliderPlayback(wrap, this.mediaSlider());
          this.activeSlideIndex = null;
          this.viewStartedAt = null;
          this.clearWatchProgressTimer();
        }
      });
    };

    this.teardownScrollSync?.();
    setupSliderViewportScrollSync(wrap, this.mediaSlider(), () => this.sliderWithSound(), (fn) => {
      this.teardownScrollSync = fn;
    });

    this.visibilityObserver = new MutationObserver(onVisibleChange);
    this.visibilityObserver.observe(wrap, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    onVisibleChange();
  }

  private stopSliderMedia(): void {
    destroySliderPlayback(this.sliderWrap()?.nativeElement, this.mediaSlider());
  }

  private teardownSliderSession(): void {
    if (this.activeSlideIndex !== null) {
      this.endSlideView(this.activeSlideIndex);
    }
    this.teardownRetentionTracking();
    this.stopSliderMedia();
    this.mediaPlayback.stopAll();
    this.teardownAvatarNavigation?.();
    this.teardownAvatarNavigation = null;
  }

  private teardownRetentionTracking(): void {
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
    this.teardownScrollSync?.();
    this.teardownScrollSync = null;
    this.clearWatchProgressTimer();
    this.activeSlideIndex = null;
    this.viewStartedAt = null;
  }

  private startSlideView(index: number): void {
    this.activeSlideIndex = index;
    this.viewStartedAt = Date.now();

    if (!this.impressionsSent.has(index)) {
      this.impressionsSent.add(index);
      this.telemetry.track(this.destroyRef, {
        ...this.telemetry.slideTelemetryBase(this.slides(), index),
        kind: 'slideImpression',
      });
    }

    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.slides(), index),
      kind: 'slideViewStart',
    });

    this.clearWatchProgressTimer();
    this.watchProgressTimer = setInterval(() => {
      if (this.activeSlideIndex === index) {
        this.emitWatchProgress(index, false);
      }
    }, WATCH_PROGRESS_INTERVAL_MS);
  }

  private endSlideView(index: number): void {
    const startedAt = this.viewStartedAt ?? Date.now();
    const viewDurationMs = Date.now() - startedAt;

    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.slides(), index),
      kind: 'slideViewEnd',
      viewDurationMs,
    });

    this.emitWatchProgress(index, true);

    if (viewDurationMs < EARLY_SKIP_MS) {
      this.telemetry.track(this.destroyRef, {
        ...this.telemetry.slideTelemetryBase(this.slides(), index),
        kind: 'slideSkipped',
        viewDurationMs,
      });
    }

    this.activeSlideIndex = null;
    this.viewStartedAt = null;
    this.clearWatchProgressTimer();
  }

  private emitWatchProgress(index: number, final: boolean): void {
    const wrap = this.sliderWrap()?.nativeElement;
    const slideEl = wrap?.querySelectorAll('media-slide')[index];
    const video = slideEl?.querySelector('video');
    const watchMs =
      video && Number.isFinite(video.currentTime)
        ? Math.round(video.currentTime * 1000)
        : this.viewStartedAt
          ? Date.now() - this.viewStartedAt
          : 0;
    const mediaDurationMs =
      video && Number.isFinite(video.duration) && video.duration > 0
        ? Math.round(video.duration * 1000)
        : null;
    const completionRate =
      mediaDurationMs && mediaDurationMs > 0
        ? Math.min(1, watchMs / mediaDurationMs)
        : null;

    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.slides(), index),
      kind: 'watchProgress',
      watchMs,
      ...(mediaDurationMs !== null ? { mediaDurationMs } : {}),
      ...(completionRate !== null ? { completionRate } : {}),
      final,
    });
  }

  private clearWatchProgressTimer(): void {
    if (this.watchProgressTimer !== null) {
      clearInterval(this.watchProgressTimer);
      this.watchProgressTimer = null;
    }
  }

  onDoubleTap(): void {
    this.telemetry.track(this.destroyRef, {
      sliderId: FEED_REELS_SLIDER_ID,
      kind: 'doubleTap',
      route: '/reels',
    });
  }

  onMutedChange(muted: boolean): void {
    this.sliderWithSound.set(!muted);
    this.syncSliderPlayback();
    this.telemetry.track(this.destroyRef, {
      sliderId: FEED_REELS_SLIDER_ID,
      kind: 'mutedChange',
      route: '/reels',
      muted,
    });
  }

  onSlideAction(event: SlideActionEvent): void {
    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.slides(), event.index),
      kind: 'slideAction',
      action: event.action,
      active: event.active,
      count: event.count,
    });
  }

  onSlideFollow(event: SlideFollowEvent): void {
    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.slides(), event.index),
      kind: 'slideFollow',
      following: event.following,
    });
  }
}
