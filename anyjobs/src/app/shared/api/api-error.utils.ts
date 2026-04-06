import { AbstractControl, ValidationErrors } from '@angular/forms';

export function toApiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Error inesperado';
}

export function setApiError(control: AbstractControl, err: unknown): void {
  const message = toApiErrorMessage(err);
  const next: ValidationErrors = { ...(control.errors ?? {}), api: message };
  control.setErrors(next);
  control.markAsTouched();
}

export function clearApiError(control: AbstractControl): void {
  const errors = control.errors ?? null;
  if (!errors || !('api' in errors)) return;

  const { api, ...rest } = errors;
  void api;
  control.setErrors(Object.keys(rest).length > 0 ? rest : null);
}

