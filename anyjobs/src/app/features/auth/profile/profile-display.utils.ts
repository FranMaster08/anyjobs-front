import type { DocumentType, Gender } from '../registration/registration.models';
import { SUPPORTED_COUNTRY_OPTIONS } from '../registration/registration.constants';
import { getWorldCountryName } from '../../../shared/location/world-countries.data';

export interface ProfileLocationParts {
  countryCode?: string;
  division?: string;
  municipality?: string;
  area?: string;
}

const DOCUMENT_TYPE_KEYS: Record<DocumentType, string> = {
  DNI: 'doc.dni',
  NIE: 'doc.nie',
  PASSPORT: 'doc.passport',
  CC: 'doc.cc',
};

const GENDER_KEYS: Record<Gender, string> = {
  MALE: 'gender.male',
  FEMALE: 'gender.female',
  OTHER: 'gender.other',
  PREFER_NOT_TO_SAY: 'gender.pnts',
};

/** Orden: barrio · municipio · departamento/provincia · país */
export function formatProfileLocationLine(
  parts: ProfileLocationParts,
  resolveCountryLabel: (code: string) => string | undefined,
): string | null {
  const country = parts.countryCode?.trim()
    ? resolveCountryLabel(parts.countryCode.trim().toUpperCase()) ?? parts.countryCode.trim()
    : undefined;
  const segments = [parts.area, parts.municipality, parts.division, country].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0,
  );
  return segments.length ? segments.map((s) => s.trim()).join(' · ') : null;
}

export function residenceCountryLabelKey(code: string): string | undefined {
  const normalized = code.trim().toUpperCase();
  return SUPPORTED_COUNTRY_OPTIONS.find((c) => c.code === normalized)?.labelKey;
}

export function documentTypeLabelKey(type: string): string | undefined {
  if (type in DOCUMENT_TYPE_KEYS) {
    return DOCUMENT_TYPE_KEYS[type as DocumentType];
  }
  return undefined;
}

export function genderLabelKey(gender: string): string | undefined {
  if (gender in GENDER_KEYS) {
    return GENDER_KEYS[gender as Gender];
  }
  return undefined;
}

export function formatNationalityLabel(code: string | undefined, locale = 'es'): string | undefined {
  if (!code?.trim()) return undefined;
  const name = getWorldCountryName(code, locale);
  if (name) return name;
  const normalized = code.trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

/** Primera letra mayúscula; el resto en minúsculas (p. ej. enums sin traducción). */
export function capitalizeLabel(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
