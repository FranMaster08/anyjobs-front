import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, delay, map, Observable, of, switchMap } from 'rxjs';

import { createMockId } from '../api/api.utils';
import { CreateProposalInput, Proposal } from './proposals.models';

const STORAGE_KEY = 'anyjobs.proposals.v1';

export const PROPOSALS_API_URL = new InjectionToken<string>('PROPOSALS_API_URL', {
  providedIn: 'root',
  // Por defecto apunta al backend (vía same-origin / proxy en dev).
  factory: () => {
    const doc = inject(DOCUMENT);
    return new URL('/proposals', doc.baseURI).toString();
  },
});

type ProposalCandidateTemplate = {
  readonly userId?: string;
  readonly authorName?: string;
  readonly authorSubtitle?: string;
  readonly rating?: number;
  readonly reviewsCount?: number;
  readonly whoAmI: string;
  readonly message: string;
  readonly estimate: string;
};

type ProposalTemplate = {
  readonly requestId: string;
  readonly candidates?: readonly ProposalCandidateTemplate[];
};

type ProposalsMock = {
  readonly templates?: readonly ProposalTemplate[];
};

function safeRead(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeWrite(value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

function parseArray(raw: string | null): Proposal[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];

    return value
      .map((x) => {
        const p = x as Partial<Proposal> | null;
        if (!p) return null;
        if (!p.id || !p.userId || !p.requestId) return null;
        if (!p.whoAmI || !p.message || !p.estimate) return null;
        if (!p.createdAt || typeof p.createdAt !== 'string') return null;
        const rawAuthor = (p as { author?: unknown }).author;
        const authorObj = rawAuthor && typeof rawAuthor === 'object' ? (rawAuthor as Record<string, unknown>) : null;
        const authorName = typeof authorObj?.['name'] === 'string' ? authorObj['name'].trim() : '';
        const authorSubtitle = typeof authorObj?.['subtitle'] === 'string' ? authorObj['subtitle'].trim() : '';
        const rawRating = authorObj?.['rating'];
        const rating =
          typeof rawRating === 'number' && Number.isFinite(rawRating) ? Math.min(5, Math.max(0, rawRating)) : undefined;
        const rawReviews = authorObj?.['reviewsCount'];
        const reviewsCount =
          typeof rawReviews === 'number' && Number.isFinite(rawReviews) && rawReviews >= 0
            ? Math.floor(rawReviews)
            : undefined;

        return {
          id: String(p.id),
          userId: String(p.userId),
          requestId: String(p.requestId),
          ...(authorName.length > 0
            ? {
                author: {
                  name: authorName,
                  ...(authorSubtitle.length > 0 ? { subtitle: authorSubtitle } : {}),
                  ...(rating !== undefined ? { rating } : {}),
                  ...(reviewsCount !== undefined ? { reviewsCount } : {}),
                },
              }
            : {}),
          whoAmI: String(p.whoAmI),
          message: String(p.message),
          estimate: String(p.estimate),
          createdAt: String(p.createdAt),
          status: 'SENT',
        } satisfies Proposal;
      })
      .filter((x): x is Proposal => x !== null);
  } catch {
    return [];
  }
}

function readAll(): Proposal[] {
  return parseArray(safeRead());
}

function writeAll(items: readonly Proposal[]): void {
  safeWrite(JSON.stringify(items));
}

@Injectable({ providedIn: 'root' })
export class ProposalsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(PROPOSALS_API_URL);
  private readonly seededUsers = new Set<string>();

  private seedFromMockForRequest(requestId: string, userIdForFirstCandidate?: string): Observable<void> {
    const rid = requestId.trim();
    if (!this.apiUrl.includes('/mock/')) return of(void 0);
    if (rid.length === 0) return of(void 0);

    return this.http.get<ProposalsMock>(this.apiUrl).pipe(
      map((mock) => (mock.templates ?? []).find((t) => (t.requestId ?? '').trim() === rid) ?? null),
      map((template) => {
        if (!template) return;
        const candidates = (template.candidates ?? []).slice(0, 12);
        if (candidates.length === 0) return;

        const prev = readAll();
        const next = prev.slice();
        const now = Date.now();

        for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
          const c = candidates[cIdx]!;
          const whoAmI = (c.whoAmI ?? '').trim();
          const message = (c.message ?? '').trim();
          const estimate = (c.estimate ?? '').trim();
          if (!whoAmI || !message || !estimate) continue;

          const belongsToUser = cIdx === 0;
          const userId = (belongsToUser ? userIdForFirstCandidate : c.userId) ?? '';
          const resolvedUserId = (userId || `worker_demo_${cIdx + 1}`).trim();
          if (!resolvedUserId) continue;

          const authorName = (c.authorName ?? (belongsToUser ? 'Tú' : `Postulante ${cIdx + 1}`)).trim();
          const authorSubtitle = (c.authorSubtitle ?? '').trim();
          const rawRating = c.rating ?? null;
          const rating =
            typeof rawRating === 'number' && Number.isFinite(rawRating) ? Math.min(5, Math.max(0, rawRating)) : undefined;
          const rawReviews = c.reviewsCount ?? null;
          const reviewsCount =
            typeof rawReviews === 'number' && Number.isFinite(rawReviews) && rawReviews >= 0
              ? Math.floor(rawReviews)
              : undefined;

          const existingIdx = next.findIndex((p) => p.requestId === rid && p.userId === resolvedUserId);
          if (existingIdx >= 0) {
            const existing = next[existingIdx]!;
            // Si ya existe, la "upgradeamos" para que tenga author info (si falta).
            if (!existing.author || !existing.author.name) {
              next[existingIdx] = {
                ...existing,
                author: {
                  name: authorName.length > 0 ? authorName : 'Postulante',
                  ...(authorSubtitle.length > 0 ? { subtitle: authorSubtitle } : {}),
                  ...(rating !== undefined ? { rating } : {}),
                  ...(reviewsCount !== undefined ? { reviewsCount } : {}),
                },
              };
              continue;
            }
            continue;
          }

          next.push({
            id: createMockId('proposal'),
            requestId: rid,
            userId: resolvedUserId,
            author: {
              name: authorName.length > 0 ? authorName : 'Postulante',
              ...(authorSubtitle.length > 0 ? { subtitle: authorSubtitle } : {}),
              ...(rating !== undefined ? { rating } : {}),
              ...(reviewsCount !== undefined ? { reviewsCount } : {}),
            },
            whoAmI,
            message,
            estimate,
            createdAt: new Date(now - cIdx * 6 * 60 * 60 * 1000).toISOString(),
            status: 'SENT',
          });
        }

        // Evitar escrituras si no cambió nada
        if (next.length !== prev.length || next.some((p, i) => p !== prev[i])) {
          writeAll(next);
        }
      }),
      map(() => void 0),
      catchError(() => of(void 0)),
    );
  }

  private ensureSeededForUser(userId: string): Observable<void> {
    const uid = userId.trim();
    if (uid.length === 0) return of(void 0);
    if (!this.apiUrl.includes('/mock/')) return of(void 0);
    if (this.seededUsers.has(uid)) return of(void 0);

    const alreadyHas = readAll().some((p) => p.userId === uid);
    if (alreadyHas) {
      this.seededUsers.add(uid);
      return of(void 0);
    }

    return this.http.get<ProposalsMock>(this.apiUrl).pipe(
      map((mock) => (mock.templates ?? []).slice(0, 6)),
      map((templates) => {
        const now = Date.now();
        const seeded: Proposal[] = [];

        for (let tIdx = 0; tIdx < templates.length; tIdx++) {
          const t = templates[tIdx]!;
          const requestId = (t.requestId ?? '').trim();
          if (!requestId) continue;

          const candidates = (t.candidates ?? []).slice(0, 6);
          if (candidates.length === 0) continue;

          for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
            const c = candidates[cIdx]!;
            const whoAmI = (c.whoAmI ?? '').trim();
            const message = (c.message ?? '').trim();
            const estimate = (c.estimate ?? '').trim();
            if (!whoAmI || !message || !estimate) continue;

            // Una propuesta debe pertenecer al usuario actual para poblar "Mis solicitudes".
            const belongsToUser = cIdx === 0;
            const proposalUserId = belongsToUser ? uid : (c.userId ?? `worker_demo_${cIdx}`).trim();

            const authorName = (c.authorName ?? (belongsToUser ? 'Tú' : `Postulante ${cIdx + 1}`)).trim();
            const authorSubtitle = (c.authorSubtitle ?? '').trim();
            const rawRating = c.rating ?? null;
            const rating =
              typeof rawRating === 'number' && Number.isFinite(rawRating)
                ? Math.min(5, Math.max(0, rawRating))
                : undefined;
            const rawReviews = c.reviewsCount ?? null;
            const reviewsCount =
              typeof rawReviews === 'number' && Number.isFinite(rawReviews) && rawReviews >= 0
                ? Math.floor(rawReviews)
                : undefined;

            seeded.push({
              id: createMockId('proposal'),
              requestId,
              userId: proposalUserId,
              author: {
                name: authorName,
                ...(authorSubtitle.length > 0 ? { subtitle: authorSubtitle } : {}),
                ...(rating !== undefined ? { rating } : {}),
                ...(reviewsCount !== undefined ? { reviewsCount } : {}),
              },
              whoAmI,
              message,
              estimate,
              createdAt: new Date(now - (tIdx * 3 + cIdx) * 10 * 60 * 60 * 1000).toISOString(),
              status: 'SENT',
            });
          }
        }

        if (seeded.length === 0) return;

        const prev = readAll();
        writeAll([...prev, ...seeded]);
      }),
      map(() => {
        this.seededUsers.add(uid);
      }),
      catchError(() => {
        this.seededUsers.add(uid);
        return of(void 0);
      }),
    );
  }

  listByUser(userId: string): Observable<readonly Proposal[]> {
    const uid = userId.trim();
    if (uid.length === 0) return of([]);
    if (!this.apiUrl.includes('/mock/')) {
      return this.http
        .get<{ items?: Proposal[] }>(this.apiUrl, { params: { userId: uid, page: 1, pageSize: 100 } })
        .pipe(
          map((res) => (res.items ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))),
        );
    }

    return this.ensureSeededForUser(uid).pipe(
      switchMap(() => {
        const items = readAll()
          .filter((p) => p.userId === uid)
          .slice()
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return of(items).pipe(delay(150));
      }),
    );
  }

  getByUserAndRequest(userId: string, requestId: string): Observable<Proposal | null> {
    const uid = userId.trim();
    const rid = requestId.trim();
    if (uid.length === 0 || rid.length === 0) return of(null);
    if (!this.apiUrl.includes('/mock/')) {
      return this.http
        .get<{ items?: Proposal[] }>(this.apiUrl, { params: { userId: uid, requestId: rid, page: 1, pageSize: 1 } })
        .pipe(map((res) => (res.items ?? [])[0] ?? null));
    }

    return this.ensureSeededForUser(uid).pipe(
      switchMap(() => {
        const found = readAll().find((p) => p.userId === uid && p.requestId === rid) ?? null;
        return of(found).pipe(delay(50));
      }),
    );
  }

  listByRequest(requestId: string, seedForUserId?: string): Observable<readonly Proposal[]> {
    const rid = requestId.trim();
    if (rid.length === 0) return of([]).pipe(delay(50));

    if (!this.apiUrl.includes('/mock/')) {
      return this.http
        .get<{ items?: Proposal[] }>(this.apiUrl, { params: { requestId: rid, page: 1, pageSize: 100 } })
        .pipe(
          map((res) => (res.items ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))),
        );
    }

    const seed$ = seedForUserId
      ? this.ensureSeededForUser(seedForUserId).pipe(switchMap(() => this.seedFromMockForRequest(rid, seedForUserId)))
      : this.seedFromMockForRequest(rid, undefined);

    return seed$.pipe(
      switchMap(() => {
        const items = readAll()
          .filter((p) => p.requestId === rid)
          .slice()
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return of(items).pipe(delay(120));
      }),
    );
  }

  sendProposal(input: CreateProposalInput): Observable<Proposal> {
    const requestId = input.requestId.trim();
    const userId = input.userId.trim();
    const whoAmI = input.whoAmI.trim();
    const message = input.message.trim();
    const estimate = input.estimate.trim();

    const authorName = (input.authorName ?? '').trim();
    const authorSubtitle = (input.authorSubtitle ?? '').trim();

    if (!this.apiUrl.includes('/mock/')) {
      return this.http.post<Proposal>(this.apiUrl, {
        requestId,
        userId,
        authorName: authorName.length > 0 ? authorName : 'Usuario',
        authorSubtitle: authorSubtitle.length > 0 ? authorSubtitle : 'Perfil',
        whoAmI,
        message,
        estimate,
      });
    }

    const next: Proposal = {
      id: createMockId('proposal'),
      requestId,
      userId,
      ...(authorName.length > 0
        ? {
            author: {
              name: authorName,
              ...(authorSubtitle.length > 0 ? { subtitle: authorSubtitle } : {}),
            },
          }
        : {}),
      whoAmI,
      message,
      estimate,
      createdAt: new Date().toISOString(),
      status: 'SENT',
    };

    const prev = readAll();
    writeAll([...prev, next]);
    return of(next).pipe(delay(250));
  }
}

