import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';

import { RegisterRequest, RegisterResponse, VerifyOtpRequest } from './auth.models';
import { createMockId } from './api.utils';

export const AUTH_API_URL = new InjectionToken<string>('AUTH_API_URL', {
  providedIn: 'root',
  // MVP: por defecto, mock en memoria (sin backend).
  factory: () => '/mock/auth',
});

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(AUTH_API_URL);

  register(req: RegisterRequest): Observable<RegisterResponse> {
    if (this.apiUrl.includes('/mock/')) {
      const userId = createMockId('user');
      const phoneRequired = req.roles.includes('WORKER');
      return of<RegisterResponse>({
        userId,
        status: 'PENDING',
        emailVerificationRequired: true,
        phoneVerificationRequired: phoneRequired,
        nextStage: 'VERIFY',
      }).pipe(delay(350));
    }
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, req);
  }

  verifyEmail(req: VerifyOtpRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) {
      const otp = req.otpCode.trim();
      if (otp.length < 4) {
        return new Observable<void>((sub) => sub.error(new Error('OTP inválido')));
      }
      return of(void 0).pipe(delay(250));
    }
    return this.http.post<void>(`${this.apiUrl}/verify-email`, req);
  }

  verifyPhone(req: VerifyOtpRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) {
      const otp = req.otpCode.trim();
      if (otp.length < 4) {
        return new Observable<void>((sub) => sub.error(new Error('OTP inválido')));
      }
      return of(void 0).pipe(delay(250));
    }
    return this.http.post<void>(`${this.apiUrl}/verify-phone`, req);
  }

  isEmailAvailable(email: string): Observable<boolean> {
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length === 0) return of(true);

    if (this.apiUrl.includes('/mock/')) {
      // Mock simple: algunos emails "reservados" simulan ya-existente
      const taken = new Set(['taken@anyjobs.test', 'admin@anyjobs.test']);
      return of(!taken.has(trimmed)).pipe(delay(250));
    }

    return this.http
      .get<{ available: boolean }>(`${this.apiUrl}/email-available`, { params: { email: trimmed } })
      .pipe(map((res) => Boolean(res.available)));
  }

  isPhoneAvailable(phoneNumber: string): Observable<boolean> {
    const trimmed = phoneNumber.trim();
    if (trimmed.length === 0) return of(true);

    if (this.apiUrl.includes('/mock/')) {
      const taken = new Set(['+34111111111', '+34999999999']);
      return of(!taken.has(trimmed)).pipe(delay(250));
    }

    return this.http
      .get<{ available: boolean }>(`${this.apiUrl}/phone-available`, { params: { phoneNumber: trimmed } })
      .pipe(map((res) => Boolean(res.available)));
  }
}

