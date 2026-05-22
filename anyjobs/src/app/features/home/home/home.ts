import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  Injector,
  runInInjectionContext,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  MediaSliderComponent,
  type SlideActionEvent,
  type SlideData,
  type SlideFollowEvent,
} from 'ngx-vertical-slider';

import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { MediaPlaybackService } from '../../../shared/media/media-playback.service';
import {
  bootstrapSliderPlayback,
  destroySliderPlayback,
  pauseSliderPlayback,
  setupSliderViewportScrollSync,
} from '../../../shared/media/media-slider-playback';
import { setupSliderAvatarProfileNavigation } from '../../../shared/media/media-slider-profile-nav';
import { HomeFeaturedReelsDataService } from '../../../shared/media/home-featured-reels-data.service';
import type { ReelSlide } from '../../../shared/media/feed-reels-slide';
import { VIEWPORT_DESKTOP_MIN_MQ } from '../../../shared/media/viewport-breakpoint';
import { ReelsDesktopGalleryComponent } from '../../reels-feed/reels-desktop-gallery/reels-desktop-gallery';

import { HomeMobileBottomNavComponent } from '../home-mobile-bottom-nav/home-mobile-bottom-nav';

type FeaturedReelSlide = ReelSlide;

const ANONYMOUS_ACTOR_KEY = 'anyjobs.reels.actor.anonymousId';
const EARLY_SKIP_MS = 2000;
const WATCH_PROGRESS_INTERVAL_MS = 5000;
const COMMENTS_PANEL_CLOSE_MS = 280;

function storageGet(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

@Component({
  selector: 'app-home',
  imports: [MediaSliderComponent, HomeMobileBottomNavComponent, ReelsDesktopGalleryComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private static readonly SLIDER_ID = 'home-featured-reels';

  private readonly http = inject(HttpClient);
  private readonly featuredData = inject(HomeFeaturedReelsDataService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthSessionService);
  private readonly mediaPlayback = inject(MediaPlaybackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly sliderWrap = viewChild<ElementRef<HTMLElement>>('homeSliderWrap');
  private readonly mediaSlider = viewChild(MediaSliderComponent);

  /** Escritorio: >900px (alineado a `SHELL_HEADER_COMPACT_MAX_PX`). */
  readonly isDesktopViewport = signal(
    typeof matchMedia !== 'undefined' ? matchMedia(VIEWPORT_DESKTOP_MIN_MQ).matches : false,
  );

  private readonly interactionsUrl = new URL(
    '/feed/reels/interactions',
    this.document.baseURI,
  ).toString();

  readonly loaded = signal(false);
  readonly loadFailed = signal(false);
  readonly slides = signal<readonly FeaturedReelSlide[]>([]);

  readonly commentsPanelOpen = signal(false);
  readonly commentsPanelClosing = signal(false);
  readonly commentsPanelSlideIndex = signal<number | null>(null);
  readonly commentsPanelReelId = signal<string | null>(null);
  protected readonly commentsPanelTitleId = 'home-comments-panel-title';

  /** `true` = audio activo; alineado al botón mute de la librería (`withSound = !muted`). */
  private readonly sliderWithSound = signal(true);

  private activeSlideIndex: number | null = null;
  private previousBodyOverflow: string | null = null;
  private commentsPanelCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private viewStartedAt: number | null = null;
  private readonly impressionsSent = new Set<number>();
  private visibilityObserver: MutationObserver | null = null;
  private teardownScrollSync: (() => void) | null = null;
  private watchProgressTimer: ReturnType<typeof setInterval> | null = null;
  private teardownAvatarNavigation: (() => void) | null = null;

  constructor() {
    this.featuredData
      .loadFeatured(15)
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
          this.closeCommentsPanel();
          this.teardownSliderSession();
        }
      };
      mq.addEventListener('change', onMqChange);
      this.destroyRef.onDestroy(() => mq.removeEventListener('change', onMqChange));
    }

    this.destroyRef.onDestroy(() => {
      this.clearCommentsPanelCloseTimer();
      this.unlockBodyScroll();
      this.teardownSliderSession();
    });

    effect(() => {
      if (this.isDesktopViewport()) return;
      if (!this.loaded() || this.loadFailed() || this.slides().length === 0) return;
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => {
          this.setupRetentionTracking();
          this.setupAvatarProfileNavigation();
          this.ensureFirstVideoPlays();
        });
      });
    });
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

  private syncSliderPlayback(): void {
    const wrap = this.sliderWrap()?.nativeElement;
    if (!wrap) return;
    this.mediaPlayback.syncSlider(wrap, this.sliderWithSound(), this.mediaSlider());
  }

  /** Tras cargar slides async, el IntersectionObserver a veces no dispara play en el primer reel. */
  private ensureFirstVideoPlays(): void {
    const wrap = this.sliderWrap()?.nativeElement;
    if (!wrap) return;
    bootstrapSliderPlayback(wrap, this.mediaSlider(), this.sliderWithSound());
  }

  private slideMediaAt(index: number): string | null {
    return this.slides()[index]?.media ?? null;
  }

  private slideReelId(index: number): string | null {
    return (this.slides()[index] as FeaturedReelSlide | undefined)?.id ?? null;
  }

  private anonymousActorId(): string {
    let id = storageGet(ANONYMOUS_ACTOR_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      storageSet(ANONYMOUS_ACTOR_KEY, id);
    }
    return id;
  }

  private actorPayload(): Record<string, unknown> {
    const vm = this.auth.vm();
    const anonymousId = this.anonymousActorId();
    const emittedAt = new Date().toISOString();

    if (vm.isLoggedIn && vm.user) {
      return {
        subjectType: 'user',
        userId: vm.user.id,
        userRoles: vm.user.roles,
        anonymousId,
        emittedAt,
      };
    }

    return {
      subjectType: 'anonymous',
      userId: null,
      anonymousId,
      emittedAt,
    };
  }

  private trackInteraction(payload: Record<string, unknown>): void {
    this.http
      .post(this.interactionsUrl, { ...this.actorPayload(), ...payload })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  private slideTelemetryBase(index: number): Record<string, unknown> {
    return {
      sliderId: Home.SLIDER_ID,
      route: '/home',
      slideIndex: index,
      slideMedia: this.slideMediaAt(index),
      reelId: this.slideReelId(index),
    };
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

        if (
          this.commentsPanelOpen() &&
          index !== null &&
          index !== this.commentsPanelSlideIndex()
        ) {
          this.closeCommentsPanel();
        }

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
      this.trackInteraction({
        ...this.slideTelemetryBase(index),
        kind: 'slideImpression',
      });
    }

    this.trackInteraction({
      ...this.slideTelemetryBase(index),
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

    this.trackInteraction({
      ...this.slideTelemetryBase(index),
      kind: 'slideViewEnd',
      viewDurationMs,
    });

    this.emitWatchProgress(index, true);

    if (viewDurationMs < EARLY_SKIP_MS) {
      this.trackInteraction({
        ...this.slideTelemetryBase(index),
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

    this.trackInteraction({
      ...this.slideTelemetryBase(index),
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
    this.trackInteraction({
      sliderId: Home.SLIDER_ID,
      kind: 'doubleTap',
      route: '/home',
    });
  }

  onMutedChange(muted: boolean): void {
    this.sliderWithSound.set(!muted);
    this.syncSliderPlayback();
    this.trackInteraction({
      sliderId: Home.SLIDER_ID,
      kind: 'mutedChange',
      route: '/home',
      muted,
    });
  }

  onSlideAction(event: SlideActionEvent): void {
    this.trackInteraction({
      ...this.slideTelemetryBase(event.index),
      kind: 'slideAction',
      action: event.action,
      active: event.active,
      count: event.count,
    });

    if (event.action === 'comment') {
      this.openCommentsPanel(event.index);
    }
  }

  /** Galería desktop: telemetría la registra el componente hijo; aquí solo UI de comentarios. */
  onDesktopGallerySlideAction(event: SlideActionEvent): void {
    if (event.action === 'comment') {
      this.openCommentsPanel(event.index);
    }
  }

  protected commentsPanelVisible(): boolean {
    return this.commentsPanelOpen() || this.commentsPanelClosing();
  }

  protected commentsPanelShown(): boolean {
    return this.commentsPanelOpen() && !this.commentsPanelClosing();
  }

  private openCommentsPanel(slideIndex: number): void {
    this.clearCommentsPanelCloseTimer();
    this.commentsPanelClosing.set(false);
    this.commentsPanelSlideIndex.set(slideIndex);
    this.commentsPanelReelId.set(this.slideReelId(slideIndex));
    this.commentsPanelOpen.set(true);
    this.lockBodyScroll();
  }

  protected closeCommentsPanel(): void {
    if (!this.commentsPanelOpen() && !this.commentsPanelClosing()) return;
    if (this.commentsPanelClosing()) return;

    this.commentsPanelClosing.set(true);
    this.unlockBodyScroll();

    this.clearCommentsPanelCloseTimer();
    this.commentsPanelCloseTimer = setTimeout(() => {
      this.commentsPanelOpen.set(false);
      this.commentsPanelClosing.set(false);
      this.commentsPanelSlideIndex.set(null);
      this.commentsPanelReelId.set(null);
      this.commentsPanelCloseTimer = null;
    }, COMMENTS_PANEL_CLOSE_MS);
  }

  protected onCommentsOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCommentsPanel();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.commentsPanelOpen() || this.commentsPanelClosing()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCommentsPanel();
    }
  }

  private clearCommentsPanelCloseTimer(): void {
    if (this.commentsPanelCloseTimer !== null) {
      clearTimeout(this.commentsPanelCloseTimer);
      this.commentsPanelCloseTimer = null;
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

  onSlideFollow(event: SlideFollowEvent): void {
    this.trackInteraction({
      ...this.slideTelemetryBase(event.index),
      kind: 'slideFollow',
      following: event.following,
    });
  }
}
