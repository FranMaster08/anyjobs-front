import { AbstractControl, ValidationErrors } from '@angular/forms';

import { mapRegistrationErrorToMessage } from './registration-error.utils';

export function toApiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Error inesperado';
}

export function setApiError(
  control: AbstractControl,
  err: unknown,
  messageResolver?: (err: unknown) => string,
): void {
  const message = messageResolver ? messageResolver(err) : toApiErrorMessage(err);
  const next: ValidationErrors = { ...(control.errors ?? {}), api: message };
  control.setErrors(next);
  control.markAsTouched();
}

export function setRegistrationApiError(
  control: AbstractControl,
  err: unknown,
  t: (key: string) => string,
): void {
  setApiError(control, err, (e) => mapRegistrationErrorToMessage(e, t));
}

export function clearApiError(control: AbstractControl): void {
  const errors = control.errors ?? null;
  if (!errors || !('api' in errors)) return;

  const { api, ...rest } = errors;
  void api;
  control.setErrors(Object.keys(rest).length > 0 ? rest : null);
}

