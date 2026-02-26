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

export const USERS_API_URL = new InjectionToken<string>('USERS_API_URL', {
  providedIn: 'root',
  // MVP: por defecto, mock en memoria (sin backend).
  factory: () => {
    const doc = inject(DOCUMENT);
    return new URL('mock/users', doc.baseURI).toString();
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
}

