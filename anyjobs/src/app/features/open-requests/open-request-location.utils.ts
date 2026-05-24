import {
  formatProfileLocationLine,
  type ProfileLocationParts,
} from '../auth/profile/profile-display.utils';
import { SUPPORTED_COUNTRY_OPTIONS } from '../auth/registration/registration.constants';

export interface StructuredLocationInput {
  readonly countryCode: string;
  readonly division: string;
  readonly municipality: string;
  readonly neighborhood?: string;
}

const COUNTRY_LABELS: Record<string, string> = {
  CO: 'Colombia',
  AR: 'Argentina',
};

export function countryLabelFromCode(code: string): string | undefined {
  const normalized = code.trim().toUpperCase();
  if (normalized in COUNTRY_LABELS) return COUNTRY_LABELS[normalized];
  return SUPPORTED_COUNTRY_OPTIONS.find((c) => c.code === normalized)?.code;
}

export function buildOpenRequestLocationLabel(input: StructuredLocationInput): string | null {
  const parts: ProfileLocationParts = {
    countryCode: input.countryCode,
    division: input.division,
    municipality: input.municipality,
    area: input.neighborhood?.trim() || undefined,
  };
  return formatProfileLocationLine(parts, (code) => countryLabelFromCode(code));
}
