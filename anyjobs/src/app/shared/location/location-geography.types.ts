export const SUPPORTED_COUNTRY_CODES = ['CO', 'AR'] as const;
export type SupportedCountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];
