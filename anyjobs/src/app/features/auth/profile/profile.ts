import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import type { AuthUser } from '../../../shared/auth/auth.models';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { UserApi } from '../../../shared/api/user.api';
import type { UserPrivateProfileDto, UserPublicProfileDto } from '../../../shared/api/user-profile.models';

type ProfileTab = 'info' | 'activity' | 'multimedia' | 'score';

type FetchPrivateResult =
  | { kind: 'ok'; data: UserPrivateProfileDto }
  | { kind: 'unauthorized' }
  | { kind: 'fallback'; user: AuthUser }
  | { kind: 'error' };

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthSessionService);
  protected readonly userApi = inject(UserApi);
  protected readonly vm = this.auth.vm;

  protected readonly viewState = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
  protected readonly loadError = signal<string | null>(null);
  /** Aviso no bloqueante (p. ej. datos desde sesión porque falló la API). */
  protected readonly profileBanner = signal<string | null>(null);
  protected readonly activeTab = signal<ProfileTab>('info');
  protected readonly visibilityMode = signal<'public' | 'private'>('private');
  protected readonly routeUserId = signal<string | null>(null);
  protected readonly privateProfile = signal<UserPrivateProfileDto | null>(null);
  protected readonly publicProfile = signal<UserPublicProfileDto | null>(null);

  protected readonly displayName = computed(() => {
    const priv = this.privateProfile();
    const pub = this.publicProfile();
    return priv?.fullName ?? pub?.fullName ?? this.vm().user?.fullName ?? '';
  });

  protected readonly initials = computed(() => {
    const name = this.displayName().trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
    }
    return name.slice(0, 1).toUpperCase();
  });

  protected readonly locationLine = computed(() => {
    const priv = this.privateProfile();
    const pub = this.publicProfile();
    const city = priv?.city ?? pub?.city;
    const area = priv?.area ?? pub?.area;
    const cc = priv?.countryCode ?? pub?.countryCode;
    const bits = [city, area, cc].filter(Boolean);
    return bits.length ? bits.join(' · ') : null;
  });

  protected readonly bioText = computed(() => {
    const priv = this.privateProfile();
    const pub = this.publicProfile();
    return priv?.workerBio ?? pub?.workerBio ?? null;
  });

  protected readonly headlineText = computed(() => {
    const priv = this.privateProfile();
    const pub = this.publicProfile();
    return priv?.workerHeadline ?? pub?.workerHeadline ?? null;
  });

  protected readonly rolesLine = computed(() => {
    const priv = this.privateProfile();
    const pub = this.publicProfile();
    const roles = priv?.roles ?? pub?.roles ?? this.vm().user?.roles;
    return roles?.length ? roles.join(', ') : null;
  });

  protected readonly metrics = computed(() => {
    const priv = this.privateProfile();
    const pub = this.publicProfile();
    return priv?.metrics ?? pub?.metrics ?? null;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((p: ParamMap) => p.get('userId')),
        takeUntilDestroyed(),
      )
      .subscribe((userId: string | null) => {
        this.routeUserId.set(userId);
        this.reload();
      });

    toObservable(this.auth.vm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.routeUserId()) {
          if (this.vm().isLoggedIn && (this.viewState() === 'idle' || this.viewState() === 'error')) {
            this.reload();
          }
          if (!this.vm().isLoggedIn) {
            this.viewState.set('idle');
            this.privateProfile.set(null);
            this.publicProfile.set(null);
            this.profileBanner.set(null);
          }
        }
      });
  }

  protected setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  protected reload(): void {
    const paramId = this.routeUserId();
    const sessionUser = this.vm().user;

    if (!paramId) {
      if (!this.vm().isLoggedIn) {
        this.viewState.set('idle');
        this.privateProfile.set(null);
        this.publicProfile.set(null);
        this.profileBanner.set(null);
        return;
      }
      this.fetchPrivate();
      return;
    }

    if (sessionUser?.id && sessionUser.id === paramId) {
      this.fetchPrivate();
      return;
    }

    this.fetchPublic(paramId);
  }

  private buildPrivateFromSession(u: AuthUser): UserPrivateProfileDto {
    return {
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      roles: (u.roles ?? []).map((r) => String(r)),
      visibility: 'private',
      status: u.status,
      phoneNumber: u.phoneNumber,
      emailVerified: u.emailVerified,
      phoneVerified: u.phoneVerified,
      countryCode: u.countryCode,
      city: u.city,
      area: u.area,
      coverageRadiusKm: u.coverageRadiusKm,
      workerHeadline: u.workerHeadline,
      workerBio: u.workerBio,
      workerCategories: u.workerCategories,
      preferredPaymentMethod: u.preferredPaymentMethod,
      documentType: u.documentType,
      documentNumber: u.documentNumber,
      birthDate: u.birthDate,
      gender: u.gender,
      nationality: u.nationality,
      createdAt: u.createdAt,
    };
  }

  private fetchPrivate(): void {
    if (!this.vm().isLoggedIn) {
      this.viewState.set('idle');
      return;
    }
    this.viewState.set('loading');
    this.loadError.set(null);
    this.profileBanner.set(null);
    this.userApi
      .getMyProfile()
      .pipe(
        map((data: UserPrivateProfileDto): FetchPrivateResult => ({ kind: 'ok', data })),
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            this.auth.clear();
            return of<FetchPrivateResult>({ kind: 'unauthorized' });
          }
          const msg =
            err instanceof HttpErrorResponse && err.status === 403
              ? 'No tienes permiso para cargar este perfil.'
              : err instanceof HttpErrorResponse && err.status >= 500
                ? 'El servidor respondió con un error. Inténtalo más tarde.'
                : err instanceof HttpErrorResponse && err.status === 0
                  ? 'Sin conexión con el servidor.'
                  : 'No pudimos cargar tu perfil.';
          this.loadError.set(msg);
          const u = this.vm().user;
          if (!this.routeUserId() && u?.id) {
            return of<FetchPrivateResult>({ kind: 'fallback', user: u });
          }
          return of<FetchPrivateResult>({ kind: 'error' });
        }),
      )
      .subscribe((res: FetchPrivateResult) => {
        switch (res.kind) {
          case 'ok':
            this.privateProfile.set(res.data);
            this.publicProfile.set(null);
            this.visibilityMode.set('private');
            this.loadError.set(null);
            this.profileBanner.set(null);
            this.viewState.set('ready');
            break;
          case 'unauthorized':
            this.privateProfile.set(null);
            this.publicProfile.set(null);
            this.viewState.set('idle');
            break;
          case 'fallback':
            this.privateProfile.set(this.buildPrivateFromSession(res.user));
            this.publicProfile.set(null);
            this.visibilityMode.set('private');
            this.loadError.set(null);
            this.profileBanner.set(
              'No se pudieron cargar los datos del servidor. Se muestran los datos guardados en tu dispositivo. Las métricas en vivo no están disponibles hasta que la conexión funcione.',
            );
            this.viewState.set('ready');
            break;
          case 'error':
            this.viewState.set('error');
            break;
        }
      });
  }

  private fetchPublic(userId: string): void {
    this.viewState.set('loading');
    this.loadError.set(null);
    this.profileBanner.set(null);
    this.userApi
      .getPublicProfile(userId)
      .pipe(
        catchError((err: unknown) => {
          const msg =
            err instanceof HttpErrorResponse && err.status === 404
              ? 'Este perfil no existe.'
              : err instanceof HttpErrorResponse && err.status === 0
                ? 'Sin conexión con el servidor.'
                : 'No pudimos cargar este perfil.';
          this.loadError.set(msg);
          return of(null);
        }),
      )
      .subscribe((data: UserPublicProfileDto | null) => {
        if (data) {
          this.publicProfile.set(data);
          this.privateProfile.set(null);
          this.visibilityMode.set('public');
          this.loadError.set(null);
          this.viewState.set('ready');
        } else {
          this.viewState.set('error');
        }
      });
  }

}
