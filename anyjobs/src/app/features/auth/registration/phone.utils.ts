import { PHONE_DIAL_OPTIONS } from './registration.constants';

export function buildE164Phone(dialCode: string, localNumber: string): string {
  const dial = dialCode.trim();
  const localDigits = localNumber.replace(/\D/g, '');
  if (!dial.startsWith('+') || localDigits.length === 0) return '';
  return `${dial}${localDigits}`;
}

export function parseE164Phone(e164: string): { dialCode: string; localNumber: string } | null {
  const trimmed = e164.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) return null;

  const byLength = [...PHONE_DIAL_OPTIONS].sort((a, b) => b.length - a.length);
  for (const dial of byLength) {
    if (trimmed.startsWith(dial)) {
      return {
        dialCode: dial,
        localNumber: trimmed.slice(dial.length),
      };
    }
  }

  const fallback = trimmed.match(/^(\+\d{1,3})(\d{6,14})$/);
  if (!fallback) return null;
  return { dialCode: fallback[1], localNumber: fallback[2] };
}

export function sanitizePhoneLocalInput(value: string): string {
  return value.replace(/\D/g, '');
}
