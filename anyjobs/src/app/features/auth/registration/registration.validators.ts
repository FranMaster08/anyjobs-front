import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { UserRole } from './registration.models';

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;

    const hasMinLength = value.length >= 8;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);

    return hasMinLength && hasLower && hasUpper && hasNumber && hasSymbol
      ? null
      : { strongPassword: true };
  };
}

export function e164PhoneValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;
    return /^\+[1-9]\d{7,14}$/.test(value) ? null : { e164Phone: true };
  };
}

export function rolesRequiredValidator(): ValidatorFn {
  return (control: AbstractControl<UserRole[]>): ValidationErrors | null => {
    const roles = control.value ?? [];
    return roles.length > 0 ? null : { rolesRequired: true };
  };
}

