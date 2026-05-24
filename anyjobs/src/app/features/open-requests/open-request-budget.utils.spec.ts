import { budgetCurrencyForCountry, formatOpenRequestBudgetLabel, inferCountryCodeFromLocationLabel } from './open-request-budget.utils';

describe('budgetCurrencyForCountry', () => {
  it('devuelve COP para Colombia', () => {
    expect(budgetCurrencyForCountry('CO')).toEqual({
      placeholder: '$120.000',
      hint: 'Indica el monto en pesos colombianos (COP).',
    });
  });

  it('devuelve ARS para Argentina', () => {
    expect(budgetCurrencyForCountry('AR')).toEqual({
      placeholder: '$60.000',
      hint: 'Indica el monto en pesos argentinos (ARS).',
    });
  });

  it('devuelve null sin país', () => {
    expect(budgetCurrencyForCountry('')).toBeNull();
    expect(budgetCurrencyForCountry(undefined)).toBeNull();
  });
});

describe('inferCountryCodeFromLocationLabel', () => {
  it('detecta Colombia al final del label', () => {
    expect(inferCountryCodeFromLocationLabel('Centro · Bogotá · Cundinamarca · Colombia')).toBe('CO');
  });

  it('detecta Argentina al final del label', () => {
    expect(inferCountryCodeFromLocationLabel('Palermo · CABA · Buenos Aires · Argentina')).toBe('AR');
  });
});

describe('formatOpenRequestBudgetLabel', () => {
  it('formatea montos sin moneda ni separadores según el país', () => {
    expect(
      formatOpenRequestBudgetLabel('110000', 'Centro · Bogotá · Cundinamarca · Colombia'),
    ).toBe('$110.000');
    expect(
      formatOpenRequestBudgetLabel('60000', 'Palermo · CABA · Buenos Aires · Argentina'),
    ).toBe('$60.000');
  });

  it('añade moneda a montos con separadores de miles', () => {
    expect(formatOpenRequestBudgetLabel('120.000', 'Centro · Bogotá · Colombia')).toBe('$120.000');
  });

  it('respeta presupuestos ya formateados con otra moneda', () => {
    expect(formatOpenRequestBudgetLabel('€60', 'Barcelona · España')).toBe('€60');
    expect(formatOpenRequestBudgetLabel('A convenir', 'Centro · Bogotá · Colombia')).toBe('A convenir');
  });

  it('formatea rangos numéricos', () => {
    expect(
      formatOpenRequestBudgetLabel('80000-120000', 'Centro · Bogotá · Colombia'),
    ).toBe('$80.000–$120.000');
  });
});
