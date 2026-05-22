import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { FeedReelsDataService } from './feed-reels-data.service';
import type { FeedReelsLoadResult } from './feed-reels-data.service';
import type { ReelSlide } from './feed-reels-slide';
import { filterDisplayableReelSlides } from './reel-slide-display.utils';

@Injectable({ providedIn: 'root' })
export class HomeFeaturedReelsDataService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly feedData = inject(FeedReelsDataService);

  loadFeatured(limit = 15): Observable<FeedReelsLoadResult> {
    const featuredUrl = new URL('/home/featured-reels', this.document.baseURI);
    featuredUrl.search = new HttpParams()
      .set('anonymousId', this.feedData.anonymousActorId())
      .set('limit', String(limit))
      .toString();

    return this.http.get<ReelSlide[]>(featuredUrl.toString()).pipe(
      map((data) => {
        if (!Array.isArray(data)) {
          return { slides: [] as ReelSlide[], failed: true };
        }
        return {
          slides: filterDisplayableReelSlides(
            data.map((slide) => this.feedData.normalizeSlide(slide)),
          ),
          failed: false,
        };
      }),
      catchError(() => of({ slides: [] as ReelSlide[], failed: true })),
    );
  }
}
