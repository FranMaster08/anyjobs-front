import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';

import { NotificationsApi } from './notifications.api';
import type { Notification, NotificationDto } from './notifications.models';

function mapNotification(dto: NotificationDto): Notification {
  return {
    id: String(dto.id),
    type: dto.type,
    title: String(dto.title),
    message: String(dto.message),
    entityType: dto.entityType,
    entityId: String(dto.entityId),
    isRead: Boolean(dto.isRead),
    createdAt: String(dto.createdAt),
    updatedAt: String(dto.updatedAt),
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(NotificationsApi);

  readonly items = signal<readonly Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  refreshUnreadCount(): void {
    this.api
      .unreadCount()
      .pipe(
        catchError(() => {
          this.unreadCount.set(0);
          return of({ count: 0 });
        }),
      )
      .subscribe((res) => this.unreadCount.set(res.count));
  }

  refreshList(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list()
      .pipe(
        tap((res) => {
          const items = Array.isArray(res.items) ? res.items.map(mapNotification) : [];
          this.items.set(items);
        }),
        catchError(() => {
          this.error.set('No se pudieron cargar las notificaciones.');
          this.items.set([]);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  markRead(id: string): void {
    const prev = this.items();
    this.items.set(prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (this.unreadCount() > 0) {
      const item = prev.find((n) => n.id === id);
      if (item && !item.isRead) this.unreadCount.update((c) => Math.max(0, c - 1));
    }

    this.api
      .markRead(id)
      .pipe(
        catchError(() => {
          this.items.set(prev);
          this.refreshUnreadCount();
          return of(null);
        }),
      )
      .subscribe();
  }

  markAllRead(): void {
    this.items.set(this.items().map((n) => ({ ...n, isRead: true })));
    this.unreadCount.set(0);
    this.api
      .markAllRead()
      .pipe(
        catchError(() => {
          this.refreshList();
          this.refreshUnreadCount();
          return of(null);
        }),
      )
      .subscribe();
  }

  reset(): void {
    this.items.set([]);
    this.unreadCount.set(0);
    this.loading.set(false);
    this.error.set(null);
  }
}
