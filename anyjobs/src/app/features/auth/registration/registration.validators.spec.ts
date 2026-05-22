import { FormControl } from '@angular/forms';

import { UserRole } from './registration.models';
import {
  e164PhoneValidator,
  minimumAgeValidator,
  phoneDialCodeValidator,
  phoneLocalNumberValidator,
  rolesRequiredValidator,
  strongPasswordValidator,
  isoCountryCodeValidator,
} from './registration.validators';

describe('registration.validators', () => {
  describe('strongPasswordValidator', () => {
    it('accepts a strong password', () => {
      const c = new FormControl('Aa1!aaaa', { nonNullable: true });
      expect(strongPasswordValidator()(c)).toBeNull();
    });

    it('rejects a weak password', () => {
      const c = new FormControl('password', { nonNullable: true });
      expect(strongPasswordValidator()(c)).toEqual({ strongPassword: true });
    });
  });

  describe('phoneDialCodeValidator', () => {
    it('accepts valid dial codes', () => {
      const c = new FormControl('+57', { nonNullable: true });
      expect(phoneDialCodeValidator()(c)).toBeNull();
    });

    it('rejects invalid dial codes', () => {
      const c = new FormControl('57', { nonNullable: true });
      expect(phoneDialCodeValidator()(c)).toEqual({ phoneDialInvalid: true });
    });
  });

  describe('phoneLocalNumberValidator', () => {
    it('accepts digit-only local numbers in range', () => {
      const c = new FormControl('612345678', { nonNullable: true });
      expect(phoneLocalNumberValidator()(c)).toBeNull();
    });

    it('rejects letters in local number', () => {
      const c = new FormControl('61abc', { nonNullable: true });
      expect(phoneLocalNumberValidator()(c)).toEqual({ phoneLocalInvalid: true });
    });
  });

  describe('e164PhoneValidator', () => {
    it('accepts E.164 numbers', () => {
      const c = new FormControl('+34123456789', { nonNullable: true });
      expect(e164PhoneValidator()(c)).toBeNull();
    });

    it('rejects non E.164 numbers', () => {
      const c = new FormControl('123456', { nonNullable: true });
      expect(e164PhoneValidator()(c)).toEqual({ e164Phone: true });
    });
  });

  describe('minimumAgeValidator', () => {
    it('rejects underage birth dates', () => {
      const c = new FormControl('2015-01-01', { nonNullable: true });
      expect(minimumAgeValidator(18)(c)).toEqual({ underage: true });
    });

    it('accepts adult birth dates', () => {
      const c = new FormControl('1990-01-01', { nonNullable: true });
      expect(minimumAgeValidator(18)(c)).toBeNull();
    });
  });

  describe('isoCountryCodeValidator', () => {
    it('accepts any ISO country code', () => {
      const c = new FormControl('ES', { nonNullable: true });
      expect(isoCountryCodeValidator()(c)).toBeNull();
    });

    it('rejects invalid country codes', () => {
      const c = new FormControl('XX', { nonNullable: true });
      expect(isoCountryCodeValidator()(c)).toEqual({ isoCountryCode: true });
    });
  });

  describe('rolesRequiredValidator', () => {
    it('requires at least one role', () => {
      const c = new FormControl<UserRole[]>([], { nonNullable: true });
      expect(rolesRequiredValidator()(c)).toEqual({ rolesRequired: true });
    });

    it('passes when there is a role', () => {
      const c = new FormControl<UserRole[]>(['CLIENT'], { nonNullable: true });
      expect(rolesRequiredValidator()(c)).toBeNull();
    });
  });
});

