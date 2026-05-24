import { buildOpenRequestLocationLabel } from './open-request-location.utils';

describe('buildOpenRequestLocationLabel', () => {
  it('compone barrio, municipio, división y país', () => {
    expect(
      buildOpenRequestLocationLabel({
        countryCode: 'CO',
        division: 'Antioquia',
        municipality: 'Medellín',
        neighborhood: 'El Poblado',
      }),
    ).toBe('El Poblado · Medellín · Antioquia · Colombia');
  });

  it('omite barrio vacío', () => {
    expect(
      buildOpenRequestLocationLabel({
        countryCode: 'AR',
        division: 'Ciudad Autónoma de Buenos Aires',
        municipality: 'Ciudad Autónoma de Buenos Aires',
      }),
    ).toBe('Ciudad Autónoma de Buenos Aires · Ciudad Autónoma de Buenos Aires · Argentina');
  });
});
