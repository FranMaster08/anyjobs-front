import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
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
import { catchError, finalize, of } from 'rxjs';

import {
  MediaSliderComponent,
  type SlideActionEvent,
  type SlideData,
  type SlideFollowEvent,
} from 'ngx-vertical-slider';

import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { HomeMobileBottomNavComponent } from '../../home/home-mobile-bottom-nav/home-mobile-bottom-nav';

const ANONYMOUS_ACTOR_KEY = 'anyjobs.reels.actor.anonymousId';
const EARLY_SKIP_MS = 2000;
const WATCH_PROGRESS_INTERVAL_MS = 5000;

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
  selector: 'app-reels-feed',
  imports: [MediaSliderComponent, HomeMobileBottomNavComponent],
  templateUrl: './reels-feed.html',
  styleUrl: './reels-feed.scss',
})
export class ReelsFeed {
  private static readonly SLIDER_ID = 'user-reels-feed';

  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly sliderWrap = viewChild<ElementRef<HTMLElement>>('reelsSliderWrap');

  private readonly interactionsUrl = new URL(
    '/feed/reels/interactions',
    this.document.baseURI,
  ).toString();

  readonly loaded = signal(false);
  readonly loadFailed = signal(false);
  readonly slides = signal<readonly SlideData[]>([]);

  private activeSlideIndex: number | null = null;
  private viewStartedAt: number | null = null;
  private readonly impressionsSent = new Set<number>();
  private visibilityObserver: MutationObserver | null = null;
  private watchProgressTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const feedUrl = new URL('/feed/reels', this.document.baseURI);
    feedUrl.search = new HttpParams()
      .set('anonymousId', this.anonymousActorId())
      .toString();

    this.http
      .get<SlideData[]>(feedUrl.toString())
      .pipe(
        catchError(() => {
          this.loadFailed.set(true);
          return of([] as SlideData[]);
        }),
        finalize(() => this.loaded.set(true)),
      )
      .subscribe((data) => {
        this.slides.set(Array.isArray(data) ? data : []);
        if (!Array.isArray(data)) {
          this.loadFailed.set(true);
        }
      });

    this.destroyRef.onDestroy(() => this.teardownRetentionTracking());

    effect(() => {
      if (!this.loaded() || this.loadFailed() || this.slides().length === 0) return;
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => this.setupRetentionTracking());
      });
    });
  }

  private slideMediaAt(index: number): string | null {
    return this.slides()[index]?.media ?? null;
  }

  private slideReelId(index: number): string | null {
    return (this.slides()[index] as SlideData & { id?: string })?.id ?? null;
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
      sliderId: ReelsFeed.SLIDER_ID,
      route: '/reels',
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

    const onVisibleChange = (): void => {
      const index = detectVisibleIndex();
      if (index === this.activeSlideIndex) return;
      if (this.activeSlideIndex !== null) {
        this.endSlideView(this.activeSlideIndex);
      }
      if (index !== null) {
        this.startSlideView(index);
      } else {
        this.activeSlideIndex = null;
        this.viewStartedAt = null;
        this.clearWatchProgressTimer();
      }
    };

    this.visibilityObserver = new MutationObserver(onVisibleChange);
    this.visibilityObserver.observe(wrap, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    onVisibleChange();
  }

  private teardownRetentionTracking(): void {
    if (this.activeSlideIndex !== null) {
      this.endSlideView(this.activeSlideIndex);
    }
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
    this.clearWatchProgressTimer();
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
      sliderId: ReelsFeed.SLIDER_ID,
      kind: 'doubleTap',
      route: '/reels',
    });
  }

  onMutedChange(muted: boolean): void {
    this.trackInteraction({
      sliderId: ReelsFeed.SLIDER_ID,
      kind: 'mutedChange',
      route: '/reels',
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
  }

  onSlideFollow(event: SlideFollowEvent): void {
    this.trackInteraction({
      ...this.slideTelemetryBase(event.index),
      kind: 'slideFollow',
      following: event.following,
    });
  }
}
