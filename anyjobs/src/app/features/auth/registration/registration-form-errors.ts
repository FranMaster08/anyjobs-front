import { AbstractControl, FormGroup } from '@angular/forms';

import {
  listRegistrationFieldErrorMessages,
  normalizeRegistrationFieldKey,
  readRegistrationFieldErrors,
} from '../../../shared/api/registration-error.utils';

export interface ControlErrorRule { readonly error: string; readonly messageKey: string }

export const ACCOUNT_CONTROL_ERRORS: Record<string, readonly ControlErrorRule[]> = {
  fullName: [
    { error: 'required', messageKey: 'error.fullNameMin' },
    { error: 'minlength', messageKey: 'error.fullNameMin' },
  ],
  email: [
    { error: 'required', messageKey: 'error.emailInvalid' },
    { error: 'email', messageKey: 'error.emailInvalid' },
    { error: 'emailTaken', messageKey: 'error.emailTaken' },
  ],
  phoneNumber: [
    { error: 'required', messageKey: 'error.phoneE164' },
    { error: 'e164Phone', messageKey: 'error.phoneE164' },
    { error: 'phoneTaken', messageKey: 'error.phoneTaken' },
  ],
  password: [
    { error: 'required', messageKey: 'error.passwordWeak' },
    { error: 'strongPassword', messageKey: 'error.passwordWeak' },
  ],
  selectedRoles: [{ error: 'rolesRequired', messageKey: 'error.rolesRequired' }],
  acceptTerms: [{ error: 'required', messageKey: 'error.termsRequired' }],
};

export const LOCATION_CONTROL_ERRORS: Record<string, readonly ControlErrorRule[]> = {
  countryCode: [{ error: 'required', messageKey: 'reg.error.countryCode' }],
  city: [
    { error: 'required', messageKey: 'error.cityRequired' },
    { error: 'cityNotInCountry', messageKey: 'reg.error.cityInvalid' },
  ],
  municipality: [
    { error: 'required', messageKey: 'reg.error.municipalityRequired' },
    { error: 'municipalityNotInDivision', messageKey: 'reg.error.municipalityInvalid' },
  ],
  area: [
    { error: 'required', messageKey: 'reg.error.areaRequired' },
    { error: 'minlength', messageKey: 'reg.error.areaTooShort' },
    { error: 'maxlength', messageKey: 'reg.error.areaTooLong' },
  ],
};

export const PERSONAL_CONTROL_ERRORS: Record<string, readonly ControlErrorRule[]> = {
  documentType: [{ error: 'required', messageKey: 'error.docTypeRequired' }],
  documentNumber: [
    { error: 'required', messageKey: 'error.docNumberRequired' },
    { error: 'minlength', messageKey: 'reg.error.documentNumberMin' },
    { error: 'maxlength', messageKey: 'reg.error.documentNumberMax' },
  ],
  birthDate: [
    { error: 'required', messageKey: 'error.birthDateRequired' },
    { error: 'underage', messageKey: 'reg.error.birthDateUnderage' },
    { error: 'invalidBirthDate', messageKey: 'reg.error.birthDate' },
  ],
  gender: [{ error: 'required', messageKey: 'reg.error.gender' }],
  nationality: [
    { error: 'required', messageKey: 'reg.error.nationality' },
    { error: 'isoCountryCode', messageKey: 'reg.error.nationalityInvalid' },
  ],
};

export const WORKER_PROFILE_CONTROL_ERRORS: Record<string, readonly ControlErrorRule[]> = {
  categories: [{ error: 'required', messageKey: 'error.categoriesRequired' }],
};

export function resolveControlErrorMessage(
  control: AbstractControl,
  rules: readonly ControlErrorRule[],
  t: (key: string) => string,
): string | null {
  const errors = control.errors;
  if (!errors) return null;

  for (const rule of rules) {
    if (errors[rule.error]) return t(rule.messageKey);
  }

  if (typeof errors['server'] === 'string') return errors['server'];
  return null;
}

export function collectFormControlMessages(
  form: FormGroup,
  config: Record<string, readonly ControlErrorRule[]>,
  show: boolean,
  t: (key: string) => string,
): string[] {
  if (!show) return [];

  const messages: string[] = [];
  for (const [name, rules] of Object.entries(config)) {
    const control = form.get(name);
    if (!control?.invalid) continue;
    const msg = resolveControlErrorMessage(control, rules, t);
    if (msg) messages.push(msg);
  }
  return messages;
}

export function hasInvalidControls(form: FormGroup): boolean {
  return Object.values(form.controls).some((control) => control.invalid);
}

export interface RegistrationFormTargets {
  account: FormGroup;
  location: FormGroup;
  personal: FormGroup;
  workerProfile: FormGroup;
}

const API_FIELD_TARGET: Record<string, { form: keyof RegistrationFormTargets; control: string }> = {
  fullName: { form: 'account', control: 'fullName' },
  email: { form: 'account', control: 'email' },
  phoneNumber: { form: 'account', control: 'phoneNumber' },
  password: { form: 'account', control: 'password' },
  countryCode: { form: 'location', control: 'countryCode' },
  city: { form: 'location', control: 'city' },
  municipality: { form: 'location', control: 'municipality' },
  area: { form: 'location', control: 'area' },
  documentType: { form: 'personal', control: 'documentType' },
  documentNumber: { form: 'personal', control: 'documentNumber' },
  birthDate: { form: 'personal', control: 'birthDate' },
  gender: { form: 'personal', control: 'gender' },
  nationality: { form: 'personal', control: 'nationality' },
  workerCategories: { form: 'workerProfile', control: 'categories' },
};

function resolveApiFieldTarget(
  rawKey: string,
): { form: keyof RegistrationFormTargets; control: string } | undefined {
  const normalized = normalizeRegistrationFieldKey(rawKey);
  return API_FIELD_TARGET[normalized] ?? API_FIELD_TARGET[rawKey];
}

/** Aplica errores del backend a controles y devuelve mensajes legibles para el resumen. */
export function applyRegistrationApiFieldErrors(
  forms: RegistrationFormTargets,
  err: unknown,
  t: (key: string) => string,
): string[] {
  const fieldErrors = readRegistrationFieldErrors(err);
  if (!fieldErrors) return [];

  const messages = listRegistrationFieldErrorMessages(err, t);
  const entries = Object.entries(fieldErrors);

  entries.forEach(([key, backendMessage], index) => {
    const target = resolveApiFieldTarget(key);
    if (!target) return;

    const control = forms[target.form].get(target.control);
    if (!control) return;

    const message = messages[index] ?? backendMessage;
    control.setErrors({ ...(control.errors ?? {}), server: message });
    control.markAsTouched();
    if (control.disabled) {
      control.enable({ emitEvent: false });
    }
  });

  return messages;
}
