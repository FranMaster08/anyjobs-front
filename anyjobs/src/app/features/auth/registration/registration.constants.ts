import { type DocumentType, type Gender, RegistrationStage, UserRole } from './registration.models';

export const REGISTRATION_STAGES: readonly RegistrationStage[] = [
  'ACCOUNT',
  'VERIFY',
  'LOCATION',
  'ROLE_PROFILE',
  'PERSONAL_INFO',
  'DONE',
] as const;

export const ROLE_OPTIONS: readonly UserRole[] = ['CLIENT', 'WORKER'] as const;

export const ROLE_LABEL_KEY: Record<UserRole, string> = {
  CLIENT: 'role.client',
  WORKER: 'role.worker',
};

export const STAGE_LABEL_KEY: Record<RegistrationStage, string> = {
  ACCOUNT: 'reg.step.account',
  VERIFY: 'reg.step.verify',
  LOCATION: 'reg.step.location',
  ROLE_PROFILE: 'reg.step.profile',
  PERSONAL_INFO: 'reg.step.personal',
  DONE: 'reg.step.done',
};

export const WORKER_CATEGORY_OPTIONS = ['limpieza', 'cuidado', 'reparaciones'] as const;
export type WorkerCategory = (typeof WORKER_CATEGORY_OPTIONS)[number];

export const WORKER_CATEGORY_LABEL_KEY: Record<WorkerCategory, string> = {
  limpieza: 'category.limpieza',
  cuidado: 'category.cuidado',
  reparaciones: 'category.reparaciones',
};

export type WorkerCategoryGroupId = 'homeCare' | 'maintenance';

export const WORKER_CATEGORY_GROUPS: readonly {
  readonly id: WorkerCategoryGroupId;
  readonly labelKey: string;
  readonly items: readonly WorkerCategory[];
}[] = [
  { id: 'homeCare', labelKey: 'categoryGroup.homeCare', items: ['limpieza', 'cuidado'] },
  { id: 'maintenance', labelKey: 'categoryGroup.maintenance', items: ['reparaciones'] },
] as const;

export const PAYMENT_METHOD_OPTIONS = ['CARD', 'TRANSFER', 'CASH', 'WALLET'] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number];

export const PAYMENT_METHOD_LABEL_KEY: Record<PaymentMethod, string> = {
  CARD: 'payment.card',
  TRANSFER: 'payment.transfer',
  CASH: 'payment.cash',
  WALLET: 'payment.wallet',
};

export const DOCUMENT_TYPE_OPTIONS: readonly DocumentType[] = ['DNI', 'NIE', 'PASSPORT', 'CC'] as const;
export const DOCUMENT_TYPE_LABEL_KEY: Record<DocumentType, string> = {
  DNI: 'doc.dni',
  NIE: 'doc.nie',
  PASSPORT: 'doc.passport',
  CC: 'doc.cc',
};

export const GENDER_OPTIONS: readonly Gender[] = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export const GENDER_LABEL_KEY: Record<Gender, string> = {
  MALE: 'gender.male',
  FEMALE: 'gender.female',
  OTHER: 'gender.other',
  PREFER_NOT_TO_SAY: 'gender.pnts',
};

export const SUPPORTED_COUNTRY_OPTIONS = [
  { code: 'CO', labelKey: 'country.colombia' },
  { code: 'AR', labelKey: 'country.argentina' },
] as const;

/** Indicativos telefónicos en registro (Colombia y Argentina). */
export const PHONE_DIAL_OPTIONS = ['+57', '+54'] as const;

export type SupportedCountryCode = (typeof SUPPORTED_COUNTRY_OPTIONS)[number]['code'];

export {
  getDivisionsForCountry,
  getMunicipalitiesForDivision,
  getNeighborhoodsForMunicipality,
  municipalityCatalogKey,
} from '../../../shared/location/location-geography.data';

