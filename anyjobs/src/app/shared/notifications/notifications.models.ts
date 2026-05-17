export type NotificationType =
  | 'PROPOSAL_RECEIVED'
  | 'REQUEST_RESPONSE'
  | 'ACTIVITY_INTERACTION'
  | 'REQUEST_OR_PROPOSAL_UPDATE';

export type NotificationEntityType = 'open_request' | 'proposal';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponseDto {
  items: NotificationDto[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface UnreadCountResponseDto {
  count: number;
}
