import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { isIsoCountryCode } from '../../../shared/location/world-countries.data';
import { UserRole } from './registration.models';
import {
  getDivisionsForCountry,
  getMunicipalitiesForDivision,
  type SupportedCountryCode,
} from './registration.constants';

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

export function phoneDialCodeValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;
    return /^\+[1-9]\d{0,3}$/.test(value) ? null : { phoneDialInvalid: true };
  };
}

export function phoneLocalNumberValidator(minDigits = 6, maxDigits = 12): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== value.length) return { phoneLocalInvalid: true };
    if (digits.length < minDigits || digits.length > maxDigits) return { phoneLocalInvalid: true };
    return null;
  };
}

export function rolesRequiredValidator(): ValidatorFn {
  return (control: AbstractControl<UserRole[]>): ValidationErrors | null => {
    const roles = control.value ?? [];
    return roles.length > 0 ? null : { rolesRequired: true };
  };
}

export function cityInCountryValidator(getCountryCode: () => string): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const countryCode = getCountryCode().trim().toUpperCase();
    const city = (control.value ?? '').trim();
    if (!countryCode || !city) return null;

    const allowed = getDivisionsForCountry(countryCode);
    const match = allowed.some(
      (c) => c.localeCompare(city, undefined, { sensitivity: 'accent' }) === 0,
    );
    return match ? null : { cityNotInCountry: true };
  };
}

export function municipalityInDivisionValidator(
  getCountryCode: () => string,
  getDivision: () => string,
): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const countryCode = getCountryCode().trim().toUpperCase();
    const division = getDivision().trim();
    const municipality = (control.value ?? '').trim();
    if (!countryCode || !division || !municipality) return null;

    const allowed = getMunicipalitiesForDivision(countryCode as SupportedCountryCode, division);
    const match = allowed.some(
      (m) => m.localeCompare(municipality, undefined, { sensitivity: 'accent' }) === 0,
    );
    return match ? null : { municipalityNotInDivision: true };
  };
}

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseBirthDateOnly(value: string): Date | null {
  if (!BIRTH_DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isAtLeastAge(birthDate: Date, minAge: number, referenceDate = new Date()): boolean {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= minAge;
}

/** Fecha de nacimiento con edad mínima (por defecto 18 años). */
export function minimumAgeValidator(minAge = 18): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;

    const birthDate = parseBirthDateOnly(value);
    if (!birthDate) return { invalidBirthDate: true };
    return isAtLeastAge(birthDate, minAge) ? null : { underage: true };
  };
}

/** Nacionalidad: código ISO 3166-1 alpha-2 de cualquier país reconocido. */
export function isoCountryCodeValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim().toUpperCase();
    if (!value) return null;
    return isIsoCountryCode(value) ? null : { isoCountryCode: true };
  };
}
