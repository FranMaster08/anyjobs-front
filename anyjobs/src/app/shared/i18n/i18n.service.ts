import { Injectable, signal } from '@angular/core';

export type AppLang = 'es' | 'en';

type Dictionary = Record<string, string>;

const DICTIONARIES: Record<AppLang, Dictionary> = {
  es: {
    'brand.name': 'Anyjobs',
    'nav.inicio': 'Inicio',
    'nav.solicitudes': 'Solicitudes',
    'nav.ubicacion': 'Ubicación',
    'nav.contacto': 'Contacto',
    'cta.publicar': 'Publicar / Consultar',
    'example.only_es': 'Solo en español',
    'lang.es': 'ES',
    'lang.en': 'EN',

    // Auth
    'auth.login': 'Iniciar sesión',
    'auth.logout': 'Logout',
    'auth.myProfile': 'Mi perfil',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.cancel': 'Cancelar',
    'auth.emailInvalid': 'Email inválido.',
    'auth.passwordInvalid': 'Introduce una contraseña (mín. 4).',

    // Registration
    'reg.title': 'Registro',
    'reg.subtitle': 'Onboarding por etapas (MVP).',
    'reg.progress': 'Progreso del registro',
    'reg.step.account': 'Cuenta',
    'reg.step.verify': 'Verificación',
    'reg.step.location': 'Ubicación',
    'reg.step.profile': 'Perfil',
    'reg.step.personal': 'Personal',
    'reg.step.done': 'Listo',

    'field.fullName': 'Nombre completo',
    'field.email': 'Email',
    'field.phone': 'Teléfono',
    'field.password': 'Password',
    'field.roles': 'Selecciona rol(es)',
    'field.terms': 'Acepto términos y condiciones',

    'btn.back': 'Atrás',
    'btn.continue': 'Continuar',
    'btn.finish': 'Finalizar',
    'btn.verifyEmail': 'Verificar email',
    'btn.verifyPhone': 'Verificar teléfono',
    'btn.goHome': 'Ir a Home',
    'btn.goRequests': 'Ver solicitudes',
    'btn.return': 'Volver',

    'role.client': 'CLIENT',
    'role.worker': 'WORKER',

    'error.fullNameMin': 'Introduce un nombre (mín. 3 caracteres).',
    'error.emailInvalid': 'Email inválido.',
    'error.emailTaken': 'Este email ya existe.',
    'error.phoneE164': 'Usa formato E.164 (ej. +34123456789).',
    'error.phoneTaken': 'Este teléfono ya existe.',
    'error.passwordWeak': 'Min 8, mayúscula, minúscula, número y símbolo.',
    'error.rolesRequired': 'Selecciona al menos un rol.',
    'error.termsRequired': 'Debes aceptar los términos para continuar.',
    'error.otpInvalid': 'OTP inválido.',
    'error.cityRequired': 'La ciudad es obligatoria.',
    'error.categoriesRequired': 'Selecciona al menos una categoría.',

    'verify.title': 'Verifica tu contacto',
    'verify.hint.worker': 'Para WORKER, el teléfono verificado es obligatorio (MVP).',
    'verify.hint.client': 'Para CLIENT, puedes continuar con 1 verificación (recomendado completar ambas).',
    'verify.otp.email': 'OTP Email',
    'verify.otp.sms': 'OTP SMS',
    'verify.status.verified': 'Verificado',
    'verify.status.pending': 'Pendiente',

    'location.title': 'Ubicación mínima',
    'location.hint': 'No capturamos dirección exacta durante el onboarding.',
    'location.city': 'Ciudad',
    'location.areaOptional': 'Zona (opcional)',
    'location.countryOptional': 'País (opcional)',
    'location.coverageOptional': 'Radio cobertura (km) (opcional)',

    'profile.title': 'Perfil mínimo por rol',
    'profile.hint': 'Completa lo mínimo para operar. Lo sensible va después.',
    'profile.categories': 'Categorías (mín. 1)',
    'profile.categoriesSelected': 'Seleccionadas',
    'profile.paymentMethodOptional': 'Método de pago preferido (opcional)',

    'category.limpieza': 'Limpieza',
    'category.cuidado': 'Cuidado',
    'category.reparaciones': 'Reparaciones',

    'payment.card': 'Tarjeta',
    'payment.transfer': 'Transferencia',
    'payment.cash': 'Efectivo',
    'payment.wallet': 'Wallet',

    'done.title': 'Cuenta creada',
    'done.subtitle': 'Tu cuenta ya está lista. Puedes volver a explorar y postularte.',
    'done.status': 'Estado',
    'done.emailVerified': 'Email verificado',
    'done.phoneVerified': 'Teléfono verificado',
    'done.listable': 'Visible',
    'common.yes': 'sí',
    'common.no': 'no',

    'personal.title': 'Información personal',
    'personal.hint': 'Datos básicos para completar tu perfil. (Sin documentos ni adjuntos en MVP)',
    'personal.docType': 'Tipo de documento',
    'personal.docNumber': 'Número de documento',
    'personal.birthDate': 'Fecha de nacimiento',
    'personal.gender': 'Género (opcional)',
    'personal.nationality': 'Nacionalidad (opcional)',
    'personal.docRequiredWorker': 'Obligatorio para WORKER.',

    'doc.dni': 'DNI',
    'doc.nie': 'NIE',
    'doc.passport': 'Pasaporte',
    'gender.male': 'Masculino',
    'gender.female': 'Femenino',
    'gender.other': 'Otro',
    'gender.pnts': 'Prefiero no decirlo',

    'error.docTypeRequired': 'Selecciona el tipo de documento.',
    'error.docNumberRequired': 'Introduce el número de documento.',
    'error.birthDateRequired': 'Introduce tu fecha de nacimiento.',
  },
  en: {
    'brand.name': 'Anyjobs',
    'nav.inicio': 'Home',
    'nav.solicitudes': 'Requests',
    'nav.ubicacion': 'Location',
    'nav.contacto': 'Contact',
    'cta.publicar': 'Post / Contact',
    'lang.es': 'ES',
    'lang.en': 'EN',

    // Auth
    'auth.login': 'Sign in',
    'auth.logout': 'Logout',
    'auth.myProfile': 'My profile',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.cancel': 'Cancel',
    'auth.emailInvalid': 'Invalid email.',
    'auth.passwordInvalid': 'Enter a password (min. 4).',

    // Registration
    'reg.title': 'Sign up',
    'reg.subtitle': 'Step-by-step onboarding (MVP).',
    'reg.progress': 'Registration progress',
    'reg.step.account': 'Account',
    'reg.step.verify': 'Verification',
    'reg.step.location': 'Location',
    'reg.step.profile': 'Profile',
    'reg.step.personal': 'Personal',
    'reg.step.done': 'Done',

    'field.fullName': 'Full name',
    'field.email': 'Email',
    'field.phone': 'Phone',
    'field.password': 'Password',
    'field.roles': 'Select role(s)',
    'field.terms': 'I accept terms and conditions',

    'btn.back': 'Back',
    'btn.continue': 'Continue',
    'btn.finish': 'Finish',
    'btn.verifyEmail': 'Verify email',
    'btn.verifyPhone': 'Verify phone',
    'btn.goHome': 'Go Home',
    'btn.goRequests': 'View requests',
    'btn.return': 'Return',

    'role.client': 'CLIENT',
    'role.worker': 'WORKER',

    'error.fullNameMin': 'Enter a name (min. 3 characters).',
    'error.emailInvalid': 'Invalid email.',
    'error.emailTaken': 'This email already exists.',
    'error.phoneE164': 'Use E.164 format (e.g. +34123456789).',
    'error.phoneTaken': 'This phone already exists.',
    'error.passwordWeak': 'Min 8, uppercase, lowercase, number and symbol.',
    'error.rolesRequired': 'Select at least one role.',
    'error.termsRequired': 'You must accept the terms to continue.',
    'error.otpInvalid': 'Invalid OTP.',
    'error.cityRequired': 'City is required.',
    'error.categoriesRequired': 'Select at least one category.',

    'verify.title': 'Verify your contact',
    'verify.hint.worker': 'For WORKER, a verified phone is required (MVP).',
    'verify.hint.client': 'For CLIENT, you can continue with 1 verification (recommended both).',
    'verify.otp.email': 'Email OTP',
    'verify.otp.sms': 'SMS OTP',
    'verify.status.verified': 'Verified',
    'verify.status.pending': 'Pending',

    'location.title': 'Minimum location',
    'location.hint': 'We do not capture exact address during onboarding.',
    'location.city': 'City',
    'location.areaOptional': 'Area (optional)',
    'location.countryOptional': 'Country (optional)',
    'location.coverageOptional': 'Coverage radius (km) (optional)',

    'profile.title': 'Minimum profile per role',
    'profile.hint': 'Complete the minimum to operate. Sensitive data comes later.',
    'profile.categories': 'Categories (min. 1)',
    'profile.categoriesSelected': 'Selected',
    'profile.paymentMethodOptional': 'Preferred payment method (optional)',

    'category.limpieza': 'Cleaning',
    'category.cuidado': 'Care',
    'category.reparaciones': 'Repairs',

    'payment.card': 'Card',
    'payment.transfer': 'Transfer',
    'payment.cash': 'Cash',
    'payment.wallet': 'Wallet',

    'done.title': 'Account created',
    'done.subtitle': 'Your account is ready. You can go back and start browsing.',
    'done.status': 'Status',
    'done.emailVerified': 'Email verified',
    'done.phoneVerified': 'Phone verified',
    'done.listable': 'Visible',
    'common.yes': 'yes',
    'common.no': 'no',

    'personal.title': 'Personal information',
    'personal.hint': 'Basic data to complete your profile. (No documents or uploads in MVP)',
    'personal.docType': 'Document type',
    'personal.docNumber': 'Document number',
    'personal.birthDate': 'Date of birth',
    'personal.gender': 'Gender (optional)',
    'personal.nationality': 'Nationality (optional)',
    'personal.docRequiredWorker': 'Required for WORKER.',

    'doc.dni': 'DNI',
    'doc.nie': 'NIE',
    'doc.passport': 'Passport',
    'gender.male': 'Male',
    'gender.female': 'Female',
    'gender.other': 'Other',
    'gender.pnts': 'Prefer not to say',

    'error.docTypeRequired': 'Select the document type.',
    'error.docNumberRequired': 'Enter the document number.',
    'error.birthDateRequired': 'Enter your date of birth.',
  },
};

const STORAGE_KEY = 'anyjobs.lang';

function isAppLang(value: string | null | undefined): value is AppLang {
  return value === 'es' || value === 'en';
}

function safeReadLocalStorage(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly defaultLang: AppLang = 'es';
  readonly supportedLangs: readonly AppLang[] = ['es', 'en'] as const;

  readonly lang = signal<AppLang>(this.getInitialLang());

  setLang(lang: AppLang): void {
    this.lang.set(lang);
    safeWriteLocalStorage(STORAGE_KEY, lang);
  }

  t(key: string): string {
    const lang = this.lang();
    return (
      DICTIONARIES[lang]?.[key] ??
      DICTIONARIES[this.defaultLang]?.[key] ??
      // Fallback final: mostrar la key para no romper el render
      key
    );
  }

  private getInitialLang(): AppLang {
    const stored = safeReadLocalStorage(STORAGE_KEY);
    if (isAppLang(stored)) return stored;
    return this.defaultLang;
  }
}

