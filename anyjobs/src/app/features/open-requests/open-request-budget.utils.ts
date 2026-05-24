/** Textos de presupuesto según el país seleccionado en el formulario de publicación. */
export interface BudgetCurrencyHint {
  readonly placeholder: string;
  readonly hint: string;
}

interface BudgetDisplayConfig extends BudgetCurrencyHint {
  readonly locale: string;
  readonly symbol: string;
}

const BUDGET_BY_COUNTRY: Record<string, BudgetDisplayConfig> = {
  CO: {
    placeholder: '$120.000',
    hint: 'Indica el monto en pesos colombianos (COP).',
    locale: 'es-CO',
    symbol: '$',
  },
  AR: {
    placeholder: '$60.000',
    hint: 'Indica el monto en pesos argentinos (ARS).',
    locale: 'es-AR',
    symbol: '$',
  },
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  colombia: 'CO',
  argentina: 'AR',
};

const BUDGET_RANGE_SEPARATOR = /\s*(?:-|–|—|\ba\b|\bhasta\b)\s*/i;

const HAS_CURRENCY_OR_TEXT = /[€$£]|convenir/i;

export function budgetCurrencyForCountry(countryCode: string | null | undefined): BudgetCurrencyHint | null {
  const code = (countryCode ?? '').trim().toUpperCase();
  const config = BUDGET_BY_COUNTRY[code];
  if (!config) return null;
  return { placeholder: config.placeholder, hint: config.hint };
}

/** Infiere el código de país desde el `locationLabel` (p. ej. «… · Colombia»). */
export function inferCountryCodeFromLocationLabel(
  locationLabel: string | null | undefined,
): string | null {
  const text = (locationLabel ?? '').trim();
  if (!text) return null;

  const segments = text.split('·').map((segment) => segment.trim().toLowerCase());
  const last = segments[segments.length - 1];
  if (last && last in COUNTRY_NAME_TO_CODE) {
    return COUNTRY_NAME_TO_CODE[last]!;
  }

  const lower = text.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (lower.includes(name)) return code;
  }
  return null;
}

/**
 * Formatea el presupuesto para mostrar moneda y separadores de miles.
 * Respeta valores ya formateados (€, «A convenir», etc.).
 */
export function formatOpenRequestBudgetLabel(
  budgetLabel: string | null | undefined,
  locationLabel?: string | null,
): string {
  const raw = (budgetLabel ?? '').trim();
  if (!raw) return '';

  if (HAS_CURRENCY_OR_TEXT.test(raw)) {
    return raw;
  }

  const countryCode = inferCountryCodeFromLocationLabel(locationLabel);
  return formatNumericBudgetParts(raw, countryCode);
}

function formatNumericBudgetParts(raw: string, countryCode: string | null): string {
  if (BUDGET_RANGE_SEPARATOR.test(raw)) {
    return raw
      .split(BUDGET_RANGE_SEPARATOR)
      .map((part) => formatSingleBudgetAmount(part.trim(), countryCode))
      .join('–');
  }
  return formatSingleBudgetAmount(raw, countryCode);
}

function formatSingleBudgetAmount(raw: string, countryCode: string | null): string {
  const normalized = raw.replace(/\s/g, '');

  if (/^\$/.test(normalized)) {
    return formatAmountDigits(normalized.slice(1), countryCode);
  }

  const digits = normalized.replace(/\./g, '').replace(/,/g, '');
  if (!/^\d+$/.test(digits)) {
    return raw;
  }

  return formatAmountDigits(digits, countryCode);
}

function formatAmountDigits(digits: string, countryCode: string | null): string {
  const num = Number.parseInt(digits, 10);
  if (!Number.isFinite(num)) return digits;

  const config = countryCode ? BUDGET_BY_COUNTRY[countryCode] : null;
  const locale = config?.locale ?? 'es';
  const symbol = config?.symbol ?? '$';
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num);
  return `${symbol}${formatted}`;
}
