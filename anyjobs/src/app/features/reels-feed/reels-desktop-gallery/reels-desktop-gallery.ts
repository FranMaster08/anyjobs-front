import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  Injector,
  output,
  input,
  runInInjectionContext,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  MediaSliderComponent,
  type SlideActionEvent,
  type SlideFollowEvent,
} from 'ngx-vertical-slider';

import type { ReelSlide } from '../../../shared/media/feed-reels-slide';
import {
  filterDisplayableReelSlides,
  reelSlideKey,
} from '../../../shared/media/reel-slide-display.utils';
import {
  FEED_REELS_ROUTE,
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

const PREVIEW_LOOP_SECONDS = 5;
const EARLY_SKIP_MS = 2000;
const WATCH_PROGRESS_INTERVAL_MS = 5000;

@Component({
  selector: 'app-reels-desktop-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MediaSliderComponent],
  templateUrl: './reels-desktop-gallery.html',
  styleUrl: './reels-desktop-gallery.scss',
})
export class ReelsDesktopGalleryComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly telemetry = inject(FeedReelsTelemetryService);
  private readonly mediaPlayback = inject(MediaPlaybackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly fullscreenWrap = viewChild<ElementRef<HTMLElement>>('fullscreenWrap');
  private readonly fullscreenSlider = viewChild(MediaSliderComponent);

  readonly loaded = input(false);
  readonly loadFailed = input(false);
  readonly slides = input<readonly ReelSlide[]>([]);
  readonly telemetrySliderId = input(FEED_REELS_SLIDER_ID);
  readonly telemetryRoute = input(FEED_REELS_ROUTE);
  readonly loadingLabel = input('Cargando reels…');
  readonly errorLabel = input('No se pudo cargar el feed de reels.');
  readonly emptyLabel = input('Aún no hay reels en el feed. Publica desde tu perfil.');
  readonly sectionEyebrow = input<string | null>(null);
  readonly sectionTitle = input<string | null>(null);
  readonly sectionSubtitle = input<string | null>(null);

  protected readonly sectionHeadingId = 'reels-desktop-gallery-title';

  readonly slideAction = output<SlideActionEvent>();
  readonly slideFollow = output<SlideFollowEvent>();
  readonly doubleTap = output<void>();
  readonly mutedChange = output<boolean>();

  protected readonly fullscreenOpen = signal(false);
  protected readonly fullscreenStartIndex = signal(0);
  /** `true` = audio activo por defecto; alineado al botón mute (`withSound = !muted`). */
  private readonly fullscreenWithSound = signal(true);

  private readonly previewLoopCleanups = new WeakMap<HTMLVideoElement, () => void>();
  private activeSlideIndex: number | null = null;
  private viewStartedAt: number | null = null;
  private readonly impressionsSent = new Set<number>();
  private visibilityObserver: MutationObserver | null = null;
  private teardownScrollSync: (() => void) | null = null;
  private watchProgressTimer: ReturnType<typeof setInterval> | null = null;
  private teardownAvatarNavigation: (() => void) | null = null;
  private previousBodyOverflow: string | null = null;
  private readonly brokenPreviewKeys = signal<ReadonlySet<string>>(new Set());

  protected readonly visibleSlides = computed(() => filterDisplayableReelSlides(this.slides()));

  constructor() {
    effect(() => {
      this.slides();
      this.brokenPreviewKeys.set(new Set());
    });

    this.destroyRef.onDestroy(() => {
      this.stopAllPreviewVideos();
      this.teardownFullscreenSession();
      this.unlockBodyScroll();
    });

    effect(() => {
      if (!this.fullscreenOpen()) return;
      const index = this.fullscreenStartIndex();
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => {
          this.scrollToSlideIndex(index);
          this.setupFullscreenSlider();
        });
      });
    });
  }

  private telemetryContext(): { sliderId: string; route: string } {
    return { sliderId: this.telemetrySliderId(), route: this.telemetryRoute() };
  }

  protected openFullscreen(slide: ReelSlide): void {
    const index = this.visibleSlides().findIndex(
      (item) => reelSlideKey(item) === reelSlideKey(slide),
    );
    if (index < 0) return;

    this.stopAllPreviewVideos();
    this.fullscreenWithSound.set(true);
    this.fullscreenStartIndex.set(index);
    this.fullscreenOpen.set(true);
    this.lockBodyScroll();
  }

  protected onPreviewMediaError(slide: ReelSlide): void {
    const key = reelSlideKey(slide);
    if (!key) return;
    this.brokenPreviewKeys.update((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  protected isPreviewBroken(slide: ReelSlide): boolean {
    const key = reelSlideKey(slide);
    return key.length > 0 && this.brokenPreviewKeys().has(key);
  }

  protected closeFullscreen(): void {
    if (!this.fullscreenOpen()) return;
    this.teardownFullscreenSession();
    this.fullscreenOpen.set(false);
    this.unlockBodyScroll();
    runInInjectionContext(this.injector, () => {
      afterNextRender(() => this.restoreGalleryPreviewVideos());
    });
  }

  protected onPreviewHoverStart(video: HTMLVideoElement): void {
    this.stopPreviewVideo(video);

    const onTimeUpdate = (): void => {
      if (video.currentTime >= PREVIEW_LOOP_SECONDS) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    this.previewLoopCleanups.set(video, () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
    });

    video.muted = true;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }

  protected onPreviewHoverEnd(video: HTMLVideoElement): void {
    this.stopPreviewVideo(video);
  }

  private stopPreviewVideo(video: HTMLVideoElement): void {
    this.previewLoopCleanups.get(video)?.();
    this.previewLoopCleanups.delete(video);
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // ignore
    }
  }

  private stopAllPreviewVideos(): void {
    if (typeof document === 'undefined') return;
    const root = this.document.querySelector('app-reels-desktop-gallery');
    root?.querySelectorAll('.reelsDesktopGallery__media').forEach((node) => {
      if (node instanceof HTMLVideoElement) {
        this.stopPreviewVideo(node);
      }
    });
  }

  /** Tras cerrar fullscreen, recuperar previews vaciados por hardStop global previo. */
  private restoreGalleryPreviewVideos(): void {
    const grid = this.document.querySelector(
      'app-reels-desktop-gallery .reelsDesktopGallery__grid',
    );
    if (!grid) return;

    const slides = this.visibleSlides();
    grid.querySelectorAll('.reelsDesktopGallery__item').forEach((item, index) => {
      const slide = slides[index];
      if (!slide || slide.type !== 'video' || this.isPreviewBroken(slide)) return;

      const video = item.querySelector('video.reelsDesktopGallery__media');
      if (!(video instanceof HTMLVideoElement)) return;

      const url = slide.media?.trim() ?? '';
      if (!url) return;

      if (!video.getAttribute('src')?.trim()) {
        video.src = url;
        video.load();
      }
    });
  }

  private scrollToSlideIndex(index: number): void {
    const wrap = this.fullscreenWrap()?.nativeElement;
    if (!wrap) return;
    const slideEls = wrap.querySelectorAll('media-slide');
    slideEls[index]?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  private setupFullscreenSlider(): void {
    const wrap = this.fullscreenWrap()?.nativeElement;
    if (!wrap) return;

    this.setupRetentionTracking();
    this.setupAvatarProfileNavigation();
    bootstrapSliderPlayback(
      wrap,
      this.fullscreenSlider(),
      this.fullscreenWithSound(),
      this.visibleSlides(),
    );
  }

  private syncFullscreenPlayback(): void {
    const wrap = this.fullscreenWrap()?.nativeElement;
    if (!wrap) return;
    this.mediaPlayback.syncSlider(wrap, this.fullscreenWithSound(), this.fullscreenSlider());
  }

  private setupAvatarProfileNavigation(): void {
    const wrap = this.fullscreenWrap()?.nativeElement;
    if (!wrap) return;

    this.teardownAvatarNavigation?.();
    this.teardownAvatarNavigation = setupSliderAvatarProfileNavigation(
      wrap,
      (index) => this.visibleSlides()[index]?.creatorUserId,
      (userId) => void this.router.navigate(['/usuarios', userId]),
    );
  }

  private setupRetentionTracking(): void {
    const wrap = this.fullscreenWrap()?.nativeElement;
    if (!wrap) return;
    this.teardownRetentionTracking();

    const detectVisibleIndex = (): number | null => {
      const slideEls = wrap.querySelectorAll('media-slide');
      for (let i = 0; i < slideEls.length; i++) {
        if (slideEls[i].classList.contains('is-visible')) return i;
      }
      return null;
    };

    const syncPlayback = (): void => {
      this.syncFullscreenPlayback();
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
          pauseSliderPlayback(wrap, this.fullscreenSlider());
          this.activeSlideIndex = null;
          this.viewStartedAt = null;
          this.clearWatchProgressTimer();
        }
      });
    };

    this.teardownScrollSync?.();
    setupSliderViewportScrollSync(wrap, this.fullscreenSlider(), () => this.fullscreenWithSound(), (fn) => {
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

  private teardownFullscreenSession(): void {
    if (this.activeSlideIndex !== null) {
      this.endSlideView(this.activeSlideIndex);
    }
    this.teardownRetentionTracking();
    destroySliderPlayback(this.fullscreenWrap()?.nativeElement, this.fullscreenSlider());
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
        ...this.telemetry.slideTelemetryBase(this.visibleSlides(), index, this.telemetryContext()),
        kind: 'slideImpression',
      });
    }

    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.visibleSlides(), index, this.telemetryContext()),
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
      ...this.telemetry.slideTelemetryBase(this.visibleSlides(), index, this.telemetryContext()),
      kind: 'slideViewEnd',
      viewDurationMs,
    });

    this.emitWatchProgress(index, true);

    if (viewDurationMs < EARLY_SKIP_MS) {
      this.telemetry.track(this.destroyRef, {
        ...this.telemetry.slideTelemetryBase(this.visibleSlides(), index, this.telemetryContext()),
        kind: 'slideSkipped',
        viewDurationMs,
      });
    }

    this.activeSlideIndex = null;
    this.viewStartedAt = null;
    this.clearWatchProgressTimer();
  }

  private emitWatchProgress(index: number, final: boolean): void {
    const wrap = this.fullscreenWrap()?.nativeElement;
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
      ...this.telemetry.slideTelemetryBase(this.visibleSlides(), index, this.telemetryContext()),
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

  protected trackSlide(slide: ReelSlide): string {
    return reelSlideKey(slide);
  }

  protected isVideo(slide: ReelSlide): boolean {
    return slide.type === 'video';
  }

  protected goToProfile(slide: ReelSlide, event: Event): void {
    event.stopPropagation();
    const userId = slide.creatorUserId?.trim();
    if (!userId) return;
    void this.router.navigate(['/usuarios', userId]);
  }

  protected onSlideAction(event: SlideActionEvent): void {
    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.visibleSlides(), event.index, this.telemetryContext()),
      kind: 'slideAction',
      action: event.action,
      active: event.active,
      count: event.count,
    });
    this.slideAction.emit(event);
  }

  protected onSlideFollow(event: SlideFollowEvent): void {
    this.telemetry.track(this.destroyRef, {
      ...this.telemetry.slideTelemetryBase(this.visibleSlides(), event.index, this.telemetryContext()),
      kind: 'slideFollow',
      following: event.following,
    });
    this.slideFollow.emit(event);
  }

  protected onDoubleTap(): void {
    this.telemetry.track(this.destroyRef, {
      sliderId: this.telemetrySliderId(),
      kind: 'doubleTap',
      route: this.telemetryRoute(),
    });
    this.doubleTap.emit();
  }

  protected onMutedChange(muted: boolean): void {
    this.fullscreenWithSound.set(!muted);
    this.syncFullscreenPlayback();
    this.telemetry.track(this.destroyRef, {
      sliderId: this.telemetrySliderId(),
      kind: 'mutedChange',
      route: this.telemetryRoute(),
      muted,
    });
    this.mutedChange.emit(muted);
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.fullscreenOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeFullscreen();
    }
  }

  private lockBodyScroll(): void {
    try {
      const body = this.document.body;
      if (this.previousBodyOverflow === null) {
        this.previousBodyOverflow = body.style.overflow || '';
      }
      body.style.overflow = 'hidden';
    } catch {
      // ignore
    }
  }

  private unlockBodyScroll(): void {
    try {
      const body = this.document.body;
      if (this.previousBodyOverflow !== null) {
        body.style.overflow = this.previousBodyOverflow;
        this.previousBodyOverflow = null;
      }
    } catch {
      // ignore
    }
  }
}
