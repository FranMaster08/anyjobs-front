import {
  capitalizeLabel,
  formatNationalityLabel,
  formatProfileLocationLine,
  residenceCountryLabelKey,
} from './profile-display.utils';

describe('profile-display.utils', () => {
  it('formats location with municipality in natural order', () => {
    const line = formatProfileLocationLine(
      {
        countryCode: 'CO',
        division: 'Antioquia',
        municipality: 'Medellín',
        area: 'El Poblado',
      },
      (code) => (code === 'CO' ? 'Colombia' : undefined),
    );
    expect(line).toBe('El Poblado · Medellín · Antioquia · Colombia');
  });

  it('omits missing parts', () => {
    const line = formatProfileLocationLine(
      { countryCode: 'AR', division: 'Buenos Aires', area: 'Palermo' },
      () => 'Argentina',
    );
    expect(line).toBe('Palermo · Buenos Aires · Argentina');
  });

  it('resolves residence country label keys', () => {
    expect(residenceCountryLabelKey('co')).toBe('country.colombia');
  });

  it('formats nationality with Intl', () => {
    expect(formatNationalityLabel('ES')).toBeTruthy();
  });

  it('capitalizes enum fallbacks', () => {
    expect(capitalizeLabel('WORKER')).toBe('Worker');
  });
});
