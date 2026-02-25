import { FormControl } from '@angular/forms';

import { UserRole } from './registration.models';
import { e164PhoneValidator, rolesRequiredValidator, strongPasswordValidator } from './registration.validators';

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

