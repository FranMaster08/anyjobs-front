import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthSessionService } from '../auth/auth-session.service';
import { FeedReelsDataService } from './feed-reels-data.service';
import type { ReelSlide } from './feed-reels-slide';

export const FEED_REELS_SLIDER_ID = 'user-reels-feed';
export const FEED_REELS_ROUTE = '/reels';

@Injectable({ providedIn: 'root' })
export class FeedReelsTelemetryService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthSessionService);
  private readonly feedData = inject(FeedReelsDataService);

  private readonly interactionsUrl = new URL(
    '/feed/reels/interactions',
    this.document.baseURI,
  ).toString();

  track(
    destroyRef: DestroyRef,
    payload: Record<string, unknown>,
  ): void {
    this.http
      .post(this.interactionsUrl, { ...this.actorPayload(), ...payload })
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({ error: () => undefined });
  }

  slideTelemetryBase(
    slides: readonly ReelSlide[],
    index: number,
    context?: { sliderId?: string; route?: string },
  ): Record<string, unknown> {
    const slide = slides[index];
    return {
      sliderId: context?.sliderId ?? FEED_REELS_SLIDER_ID,
      route: context?.route ?? FEED_REELS_ROUTE,
      slideIndex: index,
      slideMedia: slide?.media ?? null,
      reelId: slide?.id ?? null,
    };
  }

  private actorPayload(): Record<string, unknown> {
    const vm = this.auth.vm();
    const anonymousId = this.feedData.anonymousActorId();
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
}
