import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import type { ReelSlide } from './feed-reels-slide';
import { filterDisplayableReelSlides } from './reel-slide-display.utils';
import { resolveSlideAvatarUrl } from './user-avatar-placeholder';

const ANONYMOUS_ACTOR_KEY = 'anyjobs.reels.actor.anonymousId';

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

export interface FeedReelsLoadResult {
  slides: readonly ReelSlide[];
  failed: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeedReelsDataService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  anonymousActorId(): string {
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

  loadFeed(): Observable<FeedReelsLoadResult> {
    const feedUrl = new URL('/feed/reels', this.document.baseURI);
    feedUrl.search = new HttpParams()
      .set('anonymousId', this.anonymousActorId())
      .toString();

    return this.http.get<ReelSlide[]>(feedUrl.toString()).pipe(
      map((data) => {
        if (!Array.isArray(data)) {
          return { slides: [] as ReelSlide[], failed: true };
        }
        return {
          slides: filterDisplayableReelSlides(
            data.map((slide) => this.normalizeSlide(slide)),
          ),
          failed: false,
        };
      }),
      catchError(() => of({ slides: [] as ReelSlide[], failed: true })),
    );
  }

  normalizeSlide(raw: ReelSlide): ReelSlide {
    const user = raw.user?.trim() || 'Usuario';
    return {
      ...raw,
      type: raw.type === 'image' ? 'image' : 'video',
      media: this.resolveMediaUrl(raw.media),
      user,
      avatar: resolveSlideAvatarUrl(raw.avatar, user),
      caption: raw.caption ?? '',
      music: raw.music ?? 'sonido original',
      counts: { ...raw.counts },
      creatorUserId: raw.creatorUserId,
    };
  }

  private resolveMediaUrl(media: string): string {
    const trimmed = media?.trim() ?? '';
    if (trimmed.length === 0) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return new URL(trimmed, this.document.baseURI).href;
  }

}
