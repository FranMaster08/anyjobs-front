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

export const PAYMENT_METHOD_OPTIONS = ['CARD', 'TRANSFER', 'CASH', 'WALLET'] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number];

export const PAYMENT_METHOD_LABEL_KEY: Record<PaymentMethod, string> = {
  CARD: 'payment.card',
  TRANSFER: 'payment.transfer',
  CASH: 'payment.cash',
  WALLET: 'payment.wallet',
};

export const DOCUMENT_TYPE_OPTIONS: readonly DocumentType[] = ['DNI', 'NIE', 'PASSPORT'] as const;
export const DOCUMENT_TYPE_LABEL_KEY: Record<DocumentType, string> = {
  DNI: 'doc.dni',
  NIE: 'doc.nie',
  PASSPORT: 'doc.passport',
};

export const GENDER_OPTIONS: readonly Gender[] = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export const GENDER_LABEL_KEY: Record<Gender, string> = {
  MALE: 'gender.male',
  FEMALE: 'gender.female',
  OTHER: 'gender.other',
  PREFER_NOT_TO_SAY: 'gender.pnts',
};

