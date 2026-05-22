import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';

import {
  CompleteOnboardingRegistrationRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ValidateResetTokenRequest,
  ValidateResetTokenResponse,
  RegisterResponse,
  RegistrationStatusResponse,
  VerifyOtpRequest,
} from './auth.models';
import { buildLocationCatalogResponse, type LocationCatalog } from '../location/location-geography.data';
import { createMockId } from './api.utils';
import {
  UpdateClientProfileRequest,
  UpdateLocationRequest,
  UpdatePersonalInfoRequest,
  UpdateWorkerProfileRequest,
} from './user.models';

export const AUTH_API_URL = new InjectionToken<string>('AUTH_API_URL', {
  providedIn: 'root',
  // Por defecto apunta al backend (vía same-origin / proxy en dev).
  factory: () => {
    const doc = inject(DOCUMENT);
    return new URL('/auth', doc.baseURI).toString();
  },
});

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(AUTH_API_URL);

  register(req: RegisterRequest): Observable<RegisterResponse> {
    if (this.apiUrl.includes('/mock/')) {
      const phoneRequired = req.roles.includes('WORKER');
      return of<RegisterResponse>({
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

  updateRegistrationLocation(req: UpdateLocationRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/registration/location`, req);
  }

  updateRegistrationWorkerProfile(req: UpdateWorkerProfileRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/registration/worker-profile`, req);
  }

  updateRegistrationClientProfile(req: UpdateClientProfileRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/registration/client-profile`, req);
  }

  updateRegistrationPersonalInfo(req: UpdatePersonalInfoRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.patch<void>(`${this.apiUrl}/registration/personal-info`, req);
  }

  completeRegistration(): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(250));
    return this.http.post<void>(`${this.apiUrl}/registration/complete`, {});
  }

  completeOnboardingRegistration(req: CompleteOnboardingRegistrationRequest): Observable<void> {
    if (this.apiUrl.includes('/mock/')) return of(void 0).pipe(delay(350));
    return this.http.post<void>(`${this.apiUrl}/register/complete`, req);
  }

  getLocationCatalog(): Observable<LocationCatalog> {
    if (this.apiUrl.includes('/mock/')) {
      return of(buildLocationCatalogResponse()).pipe(delay(100));
    }
    return this.http.get<LocationCatalog>(`${this.apiUrl}/location-catalog`);
  }

  getDivisionsByCountry(countryCode: string): Observable<{ countryCode: string; divisions: string[] }> {
    const code = countryCode.trim().toUpperCase();
    if (this.apiUrl.includes('/mock/')) {
      const catalog = buildLocationCatalogResponse();
      return of({
        countryCode: code,
        divisions: [...(catalog[code as keyof LocationCatalog]?.divisions ?? [])],
      }).pipe(delay(100));
    }
    return this.http.get<{ countryCode: string; divisions: string[] }>(`${this.apiUrl}/location-catalog`, {
      params: { countryCode: code },
    });
  }

  getMunicipalitiesByDivision(
    countryCode: string,
    division: string,
  ): Observable<{ countryCode: string; division: string; municipalities: string[] }> {
    const code = countryCode.trim().toUpperCase();
    const divisionName = division.trim();
    if (this.apiUrl.includes('/mock/')) {
      const catalog = buildLocationCatalogResponse();
      const municipalities =
        catalog[code as keyof LocationCatalog]?.municipalitiesByDivision[divisionName] ?? [];
      return of({ countryCode: code, division: divisionName, municipalities: [...municipalities] }).pipe(
        delay(100),
      );
    }
    return this.http.get<{ countryCode: string; division: string; municipalities: string[] }>(
      `${this.apiUrl}/location-catalog`,
      { params: { countryCode: code, division: divisionName } },
    );
  }

  getRegistrationStatus(): Observable<RegistrationStatusResponse> {
    if (this.apiUrl.includes('/mock/')) {
      return of({ active: false });
    }
    return this.http.get<RegistrationStatusResponse>(`${this.apiUrl}/registration/status`);
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

  login(req: LoginRequest): Observable<LoginResponse> {
    const email = req.email.trim().toLowerCase();
    const password = req.password;

    if (this.apiUrl.includes('/mock/')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.trim().length < 4) {
        return new Observable<LoginResponse>((sub) => sub.error(new Error('Credenciales inválidas')));
      }

      const userId = createMockId('user');
      const token = createMockId('token');
      const fullName = email.split('@')[0]?.replace(/[._-]+/g, ' ')?.trim() || 'Usuario';

      return of<LoginResponse>({
        token,
        user: {
          id: userId,
          fullName,
          email,
          roles: ['CLIENT'],
          phoneNumber: '+34123456789',
          emailVerified: true,
          phoneVerified: false,
          status: 'ACTIVE',
          countryCode: 'ES',
          city: 'Madrid',
          area: 'Centro',
          createdAt: new Date().toISOString(),
        },
      }).pipe(delay(250));
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }

  forgotPassword(req: ForgotPasswordRequest): Observable<MessageResponse> {
    const email = req.email.trim().toLowerCase();
    if (this.apiUrl.includes('/mock/')) {
      return of({
        message:
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      }).pipe(delay(300));
    }
    return this.http.post<MessageResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  validateResetToken(req: ValidateResetTokenRequest): Observable<ValidateResetTokenResponse> {
    if (this.apiUrl.includes('/mock/')) {
      const ok = req.token.trim().length >= 8;
      return of({ valid: ok }).pipe(delay(150));
    }
    return this.http.post<ValidateResetTokenResponse>(`${this.apiUrl}/validate-reset-token`, req);
  }

  resetPassword(req: ResetPasswordRequest): Observable<MessageResponse> {
    if (this.apiUrl.includes('/mock/')) {
      if (!req.token.trim() || req.password.length < 8) {
        return new Observable<MessageResponse>((sub) =>
          sub.error(new Error('Enlace inválido o expirado.')),
        );
      }
      return of({ message: 'Contraseña actualizada correctamente.' }).pipe(delay(300));
    }
    return this.http.post<MessageResponse>(`${this.apiUrl}/reset-password`, req);
  }
}

