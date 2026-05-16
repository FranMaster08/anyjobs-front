import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';

import { AuthSessionService } from '../../shared/auth/auth-session.service';

const ANONYMOUS_ACTOR_KEY = 'anyjobs.openRequests.actor.anonymousId';

export type OpenRequestEngagementKind =
  | 'requestListImpression'
  | 'requestCardClick'
  | 'requestDetailView'
  | 'timeOnDetailMs'
  | 'proposalStarted';

export interface TrackOpenRequestEngagementInput {
  readonly kind: OpenRequestEngagementKind;
  readonly openRequestId: string;
  readonly route?: string;
  readonly listPage?: number;
  readonly viewDurationMs?: number;
}

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

@Injectable({ providedIn: 'root' })
export class OpenRequestsAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthSessionService);
  private readonly ngZone = inject(NgZone);

  private readonly interactionsUrl = new URL(
    '/open-requests/interactions',
    this.document.baseURI,
  ).toString();

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

  track(input: TrackOpenRequestEngagementInput): void {
    const openRequestId = input.openRequestId.trim();
    if (openRequestId.length === 0) return;
    if (this.interactionsUrl.includes('/mock/')) return;

    const vm = this.auth.vm();
    const anonymousId = this.anonymousActorId();
    const emittedAt = new Date().toISOString();

    const actor =
      vm.isLoggedIn && vm.user
        ? {
            subjectType: 'user' as const,
            userId: vm.user.id,
            anonymousId,
          }
        : {
            subjectType: 'anonymous' as const,
            userId: null,
            anonymousId,
          };

    const body: Record<string, unknown> = {
      ...actor,
      kind: input.kind,
      openRequestId,
      emittedAt,
    };

    if (input.route) body['route'] = input.route;
    if (input.listPage !== undefined) body['listPage'] = input.listPage;
    if (input.viewDurationMs !== undefined) body['viewDurationMs'] = input.viewDurationMs;

    this.ngZone.run(() => {
      this.http.post(this.interactionsUrl, body).subscribe({ error: () => undefined });
    });
  }
}
