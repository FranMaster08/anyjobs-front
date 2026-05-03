import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';

import {
  MediaSliderComponent,
  type SlideActionEvent,
  type SlideData,
  type SlideFollowEvent,
} from 'ngx-vertical-slider';

import { AuthSessionService } from '../../../shared/auth/auth-session.service';

/** Campaña / creatividad: viene del JSON del API; opcional en `SlideData` plano. */
type PromoSlide = SlideData & { readonly id?: string };

const ANONYMOUS_ACTOR_KEY = 'anyjobs.promo.actor.anonymousId';

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
  selector: 'app-home',
  imports: [MediaSliderComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  /** Identifica esta instancia ante el backend/analytics (si hay varios sliders en la app). */
  private static readonly SLIDER_ID = 'home-promotional';

  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthSessionService);

  private readonly interactionsUrl = new URL(
    '/promo-slides/interactions',
    this.document.baseURI,
  ).toString();

  readonly loaded = signal(false);
  readonly loadFailed = signal(false);
  readonly slides = signal<readonly SlideData[]>([]);

  constructor() {
    /** Backend (`GET /promo-slides`). Con `ng serve` y proxy va a :3000; sin proxy o API caída falla. */
    const promoUrl = new URL('/promo-slides', this.document.baseURI).toString();
    /** Respaldo offline / sin backend: asset en `public/mock/`. */
    const mockUrl = new URL('/mock/home-promo-slides.mock.json', this.document.baseURI).toString();

    this.http
      .get<SlideData[]>(promoUrl)
      .pipe(
        catchError(() => this.http.get<SlideData[]>(mockUrl)),
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
  }

  /** Referencia estable del slide dentro del feed (URL del medio; mejor que solo índice si el orden cambia). */
  private slideMediaAt(index: number): string | null {
    return this.slides()[index]?.media ?? null;
  }

  /** Identificador de negocio del slide (p. ej. campaña), si el backend lo envía en `GET /promo-slides`. */
  private slideCampaignId(index: number): string | null {
    const s = this.slides()[index] as PromoSlide | undefined;
    return s?.id ?? null;
  }

  /**
   * Actor estable antes de login (misma máquina) para enlazar funnel y futuras acciones.
   */
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

  /**
   * Quién interactúa: usuario autenticado (userId + roles) o anónimo (solo anonymousId).
   * El JWT va en header gracias al interceptor en rutas `/promo-slides` cuando hay sesión.
   */
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

  /** Envía telemetría al API (visible en Red como POST …/promo-slides/interactions). */
  private trackInteraction(payload: Record<string, unknown>): void {
    this.http.post(this.interactionsUrl, { ...this.actorPayload(), ...payload }).subscribe({
      error: () => undefined,
    });
  }

  onDoubleTap(): void {
    this.trackInteraction({
      sliderId: Home.SLIDER_ID,
      kind: 'doubleTap',
      route: '/home',
    });
  }

  onMutedChange(muted: boolean): void {
    this.trackInteraction({
      sliderId: Home.SLIDER_ID,
      kind: 'mutedChange',
      route: '/home',
      muted,
    });
  }

  onSlideAction(event: SlideActionEvent): void {
    this.trackInteraction({
      sliderId: Home.SLIDER_ID,
      kind: 'slideAction',
      route: '/home',
      slideIndex: event.index,
      slideMedia: this.slideMediaAt(event.index),
      campaignId: this.slideCampaignId(event.index),
      action: event.action,
      active: event.active,
      count: event.count,
    });
  }

  onSlideFollow(event: SlideFollowEvent): void {
    this.trackInteraction({
      sliderId: Home.SLIDER_ID,
      kind: 'slideFollow',
      route: '/home',
      slideIndex: event.index,
      slideMedia: this.slideMediaAt(event.index),
      campaignId: this.slideCampaignId(event.index),
      following: event.following,
    });
  }
}
