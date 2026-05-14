import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import {
  UpdateClientProfileRequest,
  UpdateLocationRequest,
  UpdatePersonalInfoRequest,
  UpdateWorkerProfileRequest,
} from './user.models';
import type { UserPrivateProfileDto, UserPublicProfileDto } from './user-profile.models';

export const USERS_API_URL = new InjectionToken<string>('USERS_API_URL', {
  providedIn: 'root',
  // Por defecto apunta al backend (vía same-origin / proxy en dev).
  factory: () => {
    const doc = inject(DOCUMENT);
    return new URL('/users', doc.baseURI).toString();
  },
});

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(USERS_API_URL);

  updateLocation(req: UpdateLocationRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/me/location`, req);
  }

  updateWorkerProfile(req: UpdateWorkerProfileRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/me/worker-profile`, req);
  }

  updateClientProfile(req: UpdateClientProfileRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/me/client-profile`, req);
  }

  updatePersonalInfo(req: UpdatePersonalInfoRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/me/personal-info`, req);
  }

  getMyProfile(): Observable<UserPrivateProfileDto> {
    if (this.apiUrl.includes('/mock/')) {
      const mock: UserPrivateProfileDto = {
        userId: 'mock-user',
        fullName: 'Usuario demo',
        email: 'demo@example.com',
        roles: ['WORKER'],
        visibility: 'private',
        metrics: { openRequestsPublished: 0, proposalsSent: 0 },
      };
      return of(mock).pipe(delay(200));
    }
    return this.http.get<UserPrivateProfileDto>(`${this.apiUrl}/me/profile`);
  }

  getPublicProfile(userId: string): Observable<UserPublicProfileDto> {
    const id = encodeURIComponent(userId.trim());
    if (this.apiUrl.includes('/mock/')) {
      const mock: UserPublicProfileDto = {
        userId,
        fullName: 'Usuario público',
        roles: ['CLIENT'],
        visibility: 'public',
        metrics: { openRequestsPublished: 0, proposalsSent: 0 },
      };
      return of(mock).pipe(delay(200));
    }
    return this.http.get<UserPublicProfileDto>(`${this.apiUrl}/profile/${id}`);
  }
}

