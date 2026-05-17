import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { NotificationsService } from '../../shared/notifications/notifications.service';
import { formatNotificationRelativeTime } from '../../shared/notifications/notifications-relative-time';
import type { Notification } from '../../shared/notifications/notifications.models';

@Component({
  selector: 'app-header-notifications-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './header-notifications-bell.html',
  styleUrl: './header-notifications-bell.scss',
})
export class HeaderNotificationsBellComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly notifications = inject(NotificationsService);

  protected readonly isOpen = signal(false);

  constructor() {
    this.notifications.refreshUnreadCount();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.destroyRef.onDestroy(() =>
        document.removeEventListener('visibilitychange', this.onVisibilityChange),
      );
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.notifications.refreshUnreadCount();
    }
  };

  protected badgeLabel(): string {
    const count = this.notifications.unreadCount();
    if (count <= 0) return '';
    return count > 99 ? '99+' : String(count);
  }

  protected relativeTime(iso: string): string {
    return formatNotificationRelativeTime(iso);
  }

  protected togglePanel(): void {
    const next = !this.isOpen();
    this.isOpen.set(next);
    if (next) {
      this.notifications.refreshList();
      this.notifications.refreshUnreadCount();
    }
  }

  protected closePanel(): void {
    this.isOpen.set(false);
  }

  protected markAllRead(event: Event): void {
    event.stopPropagation();
    this.notifications.markAllRead();
  }

  protected onSelect(item: Notification, event: Event): void {
    event.stopPropagation();
    if (!item.isRead) {
      this.notifications.markRead(item.id);
    }
    this.closePanel();
    if (item.entityType === 'open_request' && item.entityId) {
      void this.router.navigate(['/solicitudes', item.entityId]);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      this.closePanel();
    }
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    if (this.isOpen()) this.closePanel();
  }
}
