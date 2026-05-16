import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface MediaAssetDto {
  id: string;
  ownerUserId: string;
  mediaUrl: string;
  mimeType: string;
  mediaKind: 'image' | 'video';
  status: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  createdAt: string;
}

export interface UserReelDto {
  id: string;
  ownerUserId: string;
  mediaAssetId: string;
  caption?: string | null;
  moderationStatus: string;
  distributionStatus: string;
  publishedAt?: string | null;
  createdAt: string;
  media?: MediaAssetDto;
}

export interface UserReelListDto {
  items: UserReelDto[];
}

export const USER_MEDIA_API_URL = new InjectionToken<string>('USER_MEDIA_API_URL', {
  providedIn: 'root',
  factory: () => {
    const doc = inject(DOCUMENT);
    return new URL('/', doc.baseURI).toString().replace(/\/$/, '');
  },
});

@Injectable({ providedIn: 'root' })
export class UserMediaApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(USER_MEDIA_API_URL);

  listPublicReels(userId: string): Observable<UserReelListDto> {
    return this.http.get<UserReelListDto>(`${this.base}/users/${userId}/reels`);
  }

  listMyReels(): Observable<UserReelListDto> {
    return this.http.get<UserReelListDto>(`${this.base}/user-reels/me`);
  }

  uploadAsset(file: File): Observable<MediaAssetDto> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<MediaAssetDto>(`${this.base}/user-media/assets`, body);
  }

  createReel(mediaAssetId: string, caption?: string): Observable<UserReelDto> {
    return this.http.post<UserReelDto>(`${this.base}/user-reels`, { mediaAssetId, caption });
  }

  publishReel(reelId: string): Observable<UserReelDto> {
    return this.http.patch<UserReelDto>(`${this.base}/user-reels/${reelId}`, { publish: true });
  }

  deleteReel(reelId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/user-reels/${reelId}`);
  }
}
