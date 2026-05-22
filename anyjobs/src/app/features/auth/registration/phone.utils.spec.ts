import { buildE164Phone, parseE164Phone, sanitizePhoneLocalInput } from './phone.utils';

describe('phone.utils', () => {
  it('buildE164Phone joins dial code and local digits', () => {
    expect(buildE164Phone('+57', '300 123 4567')).toBe('+573001234567');
  });

  it('parseE164Phone splits known dial codes', () => {
    expect(parseE164Phone('+573001234567')).toEqual({
      dialCode: '+57',
      localNumber: '3001234567',
    });
  });

  it('sanitizePhoneLocalInput keeps digits only', () => {
    expect(sanitizePhoneLocalInput('61-234 abc')).toBe('61234');
  });
});
