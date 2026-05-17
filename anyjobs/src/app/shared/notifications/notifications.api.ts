import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  NotificationDto,
  NotificationsListResponseDto,
  UnreadCountResponseDto,
} from './notifications.models';

export const NOTIFICATIONS_API_URL = new InjectionToken<string>('NOTIFICATIONS_API_URL', {
  providedIn: 'root',
  factory: () => {
    const doc = inject(DOCUMENT);
    return new URL('/notifications', doc.baseURI).toString();
  },
});

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(NOTIFICATIONS_API_URL);

  list(page = 1, pageSize = 20): Observable<NotificationsListResponseDto> {
    return this.http.get<NotificationsListResponseDto>(this.baseUrl, {
      params: { page: String(page), pageSize: String(pageSize) },
    });
  }

  unreadCount(): Observable<UnreadCountResponseDto> {
    return this.http.get<UnreadCountResponseDto>(`${this.baseUrl}/unread-count`);
  }

  markRead(id: string): Observable<NotificationDto> {
    return this.http.patch<NotificationDto>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.baseUrl}/read-all`, {});
  }
}
