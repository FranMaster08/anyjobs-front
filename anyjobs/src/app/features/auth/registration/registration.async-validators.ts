import { AbstractControl, type AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { timer, map, catchError, of, switchMap } from 'rxjs';

import { AuthApi } from '../../../shared/api/auth.api';

export function emailTakenAsyncValidator(authApi: AuthApi, debounceMs = 350): AsyncValidatorFn {
  return (control: AbstractControl<string>) => {
    const value = (control.value ?? '').trim();
    if (value.length === 0) return of(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return of(null);

    return timer(debounceMs).pipe(
      switchMap(() => authApi.isEmailAvailable(value)),
      map((available) => (available ? null : ({ emailTaken: true } satisfies ValidationErrors))),
      catchError(() => of({ emailTaken: true } satisfies ValidationErrors)),
    );
  };
}

export function phoneTakenAsyncValidator(authApi: AuthApi, debounceMs = 350): AsyncValidatorFn {
  return (control: AbstractControl<string>) => {
    const value = (control.value ?? '').trim();
    if (value.length === 0) return of(null);
    if (!/^\+[1-9]\d{7,14}$/.test(value)) return of(null);

    return timer(debounceMs).pipe(
      switchMap(() => authApi.isPhoneAvailable(value)),
      map((available) => (available ? null : ({ phoneTaken: true } satisfies ValidationErrors))),
      catchError(() => of({ phoneTaken: true } satisfies ValidationErrors)),
    );
  };
}

