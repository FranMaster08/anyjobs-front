import { HttpErrorResponse } from '@angular/common/http';

export const REG_I18N_UNEXPECTED = 'reg.error.unexpected';
export const REG_I18N_VALIDATION = 'reg.error.validation';
export const REG_I18N_COMPLETE_FIELDS = 'reg.error.completeRequired';

const FIELD_I18N: Record<string, string> = {
  fullName: 'error.fullNameMin',
  email: 'error.emailInvalid',
  phoneNumber: 'error.phoneE164',
  password: 'error.passwordWeak',
  documentType: 'error.docTypeRequired',
  documentNumber: 'error.docNumberRequired',
  birthDate: 'error.birthDateRequired',
  gender: 'reg.error.gender',
  nationality: 'reg.error.nationality',
  city: 'error.cityRequired',
  municipality: 'reg.error.municipalityRequired',
  area: 'reg.error.areaRequired',
  countryCode: 'reg.error.countryCode',
  workerCategories: 'error.categoriesRequired',
  emailVerification: 'reg.error.emailVerification',
  phoneVerification: 'reg.error.phoneVerification',
  contactVerification: 'reg.error.contactVerification',
  personalInfo: 'reg.error.completeRequired',
};

const FIELD_LABEL_I18N: Record<string, string> = {
  fullName: 'field.fullName',
  email: 'field.email',
  phoneNumber: 'field.phone',
  password: 'field.password',
  documentType: 'personal.docType',
  documentNumber: 'personal.docNumber',
  birthDate: 'personal.birthDate',
  gender: 'personal.gender',
  nationality: 'personal.nationality',
  city: 'location.city',
  municipality: 'location.municipality',
  area: 'location.neighborhood',
  countryCode: 'location.country',
  workerCategories: 'profile.categories',
};

/** Normaliza rutas anidadas del backend (p. ej. personalInfo.birthDate → birthDate). */
export function normalizeRegistrationFieldKey(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split('.');
  return parts[parts.length - 1] ?? trimmed;
}

function isFieldErrorsMap(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === 'string');
}

function mergeFieldErrors(
  target: Record<string, string>,
  source: Record<string, string>,
): Record<string, string> {
  for (const [rawKey, message] of Object.entries(source)) {
    const key = normalizeRegistrationFieldKey(rawKey);
    if (!key || target[key]) continue;
    target[key] = message;
  }
  return target;
}

/** Nest antepone la ruta: "location.property municipality should not exist". */
function extractFieldFromValidationMessage(message: string): { field: string; raw: string } {
  const whitelist = message.match(/(?:^|[\w.]+\.)property\s+(\w+)\s+should not exist$/i);
  if (whitelist) {
    return { field: whitelist[1], raw: message };
  }

  const propertyMatch = message.match(/^([\w.]+)\s+(.+)$/);
  if (propertyMatch) {
    return { field: normalizeRegistrationFieldKey(propertyMatch[1]), raw: message };
  }

  return { field: '_form', raw: message };
}

function parseClassValidatorMessages(messages: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const message of messages) {
    const { field, raw } = extractFieldFromValidationMessage(message);
    if (!result[field]) result[field] = raw;
  }
  return result;
}

function extractFromDetails(details: unknown): Record<string, string> | null {
  if (!details || typeof details !== 'object') return null;

  const record = details as Record<string, unknown>;

  if (isFieldErrorsMap(record['fieldErrors'])) {
    return mergeFieldErrors({}, record['fieldErrors']);
  }

  if (isFieldErrorsMap(record)) {
    const keys = Object.keys(record);
    const known = keys.some((k) => k in FIELD_I18N || k in FIELD_LABEL_I18N || k.includes('.'));
    if (known) return mergeFieldErrors({}, record as Record<string, string>);
  }

  const message = record['message'];
  if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
    return parseClassValidatorMessages(message);
  }
  if (typeof message === 'string' && message.trim()) {
    return { _form: message.trim() };
  }

  return null;
}

/** Lee fieldErrors del cuerpo de error HTTP (AppException, ValidationPipe, etc.). */
export function readRegistrationFieldErrors(err: unknown): Record<string, string> | null {
  if (!(err instanceof HttpErrorResponse) || !err.error || typeof err.error !== 'object') {
    return null;
  }

  const body = err.error as Record<string, unknown>;
  const merged: Record<string, string> = {};

  const fromDetails = extractFromDetails(body['details']);
  if (fromDetails) mergeFieldErrors(merged, fromDetails);

  if (isFieldErrorsMap(body['fieldErrors'])) {
    mergeFieldErrors(merged, body['fieldErrors']);
  }

  const topMessage = body['message'];
  if (Array.isArray(topMessage) && topMessage.every((m) => typeof m === 'string')) {
    mergeFieldErrors(merged, parseClassValidatorMessages(topMessage));
  }

  return Object.keys(merged).length > 0 ? merged : null;
}

function mapFieldErrorMessage(
  fieldKey: string,
  backendMessage: string,
  t: (key: string) => string,
): string {
  if (fieldKey === '_form') return backendMessage;

  if (/property\s+\w+\s+should not exist/i.test(backendMessage)) {
    const labelKey = FIELD_LABEL_I18N[fieldKey];
    const fieldLabel = labelKey ? t(labelKey) : fieldKey;
    return t('reg.error.serverFieldNotSupported').replace('{{field}}', fieldLabel);
  }

  if (fieldKey === 'birthDate' && /18|adult|mayor de edad/i.test(backendMessage)) {
    return t('reg.error.birthDateUnderage');
  }

  const i18nKey = FIELD_I18N[fieldKey];
  if (i18nKey) return t(i18nKey);

  const labelKey = FIELD_LABEL_I18N[fieldKey];
  if (labelKey) return `${t(labelKey)}: ${backendMessage}`;
  return `${fieldKey}: ${backendMessage}`;
}

/** Mensajes legibles por cada campo devuelto por el backend. */
export function listRegistrationFieldErrorMessages(
  err: unknown,
  t: (key: string) => string,
): string[] {
  const fieldErrors = readRegistrationFieldErrors(err);
  if (!fieldErrors) return [];

  return Object.entries(fieldErrors).map(([key, message]) => mapFieldErrorMessage(key, message, t));
}

/**
 * Mensaje principal para errores del wizard de registro.
 * Prioriza fieldErrors del backend; evita exponer datos sensibles.
 */
export function mapRegistrationErrorToMessage(err: unknown, t: (key: string) => string): string {
  const messages = listRegistrationFieldErrorMessages(err, t);
  if (messages.length > 0) return messages.join(' ');

  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return t('reg.error.network');
    if (err.status >= 500) return t(REG_I18N_UNEXPECTED);
    if (err.status === 400 || err.status === 422) return t(REG_I18N_VALIDATION);
    const code = (err.error as { errorCode?: string } | null)?.errorCode;
    if (code === 'VALIDATION.INVALID_INPUT') return t(REG_I18N_VALIDATION);
    if (code === 'USER.EMAIL_ALREADY_EXISTS') return t('error.emailTaken');
    if (code === 'USER.PHONE_ALREADY_EXISTS') return t('error.phoneTaken');
  }

  if (err instanceof Error && err.message && !err.message.includes('Http failure response')) {
    return err.message;
  }

  return t(REG_I18N_UNEXPECTED);
}

/** Mensaje por control según fieldErrors del backend. */
export function mapRegistrationFieldError(
  err: unknown,
  fieldName: string,
  t: (key: string) => string,
): string | null {
  const fieldErrors = readRegistrationFieldErrors(err);
  if (!fieldErrors) return null;

  const normalized = normalizeRegistrationFieldKey(fieldName);
  if (!(normalized in fieldErrors)) return null;
  return mapFieldErrorMessage(normalized, fieldErrors[normalized], t);
}

/** Log seguro para depuración (sin PII). */
export function logRegistrationError(context: string, err: unknown): void {
  const fieldErrors = readRegistrationFieldErrors(err);
  const status = err instanceof HttpErrorResponse ? err.status : undefined;
  const code =
    err instanceof HttpErrorResponse && err.error && typeof err.error === 'object'
      ? (err.error as { errorCode?: string }).errorCode
      : undefined;
  console.warn('[registration]', context, {
    status,
    errorCode: code,
    fields: fieldErrors ? Object.keys(fieldErrors) : undefined,
  });
}
