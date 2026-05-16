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
    'nav.menuOpen': 'Abrir menú principal',
    'nav.menuClose': 'Cerrar menú principal',
    'nav.mobileMenuHeading': 'Menú',
    'nav.language': 'Idioma',
    'cta.publicar': 'Publicar / Consultar',
    'home.bottomNav.ariaLabel': 'Accesos rápidos',
    'home.bottomNav.perfil': 'Perfil',
    'home.bottomNav.mapa': 'Ver mapa',
    'home.bottomNav.perfilOpenLogin': 'Perfil — iniciar sesión',
    'example.only_es': 'Solo en español',
    'lang.es': 'ES',
    'lang.en': 'EN',

    // Auth
    'auth.login': 'Iniciar sesión',
    'auth.loginSubmitting': 'Iniciando sesión…',
    'auth.loginFailed':
      'Las credenciales ingresadas no son válidas o no fue posible iniciar sesión.',
    'auth.loginNetworkError':
      'No hay conexión o el servidor no respondió. Inténtalo de nuevo.',
    'auth.loginUnavailable':
      'No fue posible iniciar sesión en este momento. Inténtalo más tarde.',
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

    'role.client': 'Cliente',
    'role.worker': 'Trabajador',

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
    'error.docTypeRequired': 'Selecciona un tipo de documento.',
    'error.docNumberRequired': 'Introduce el número de documento.',
    'error.birthDateRequired': 'Introduce la fecha de nacimiento.',
    'error.categoriesRequired': 'Selecciona al menos una categoría.',
    'reg.checkingAvailability': 'Comprobando disponibilidad…',
    'reg.resumeHint': 'Retomamos tu registro en curso. Puedes continuar desde donde lo dejaste.',
    'reg.error.unexpected': 'No pudimos completar el registro. Inténtalo de nuevo.',
    'reg.error.validation': 'Revisa los datos del formulario.',
    'reg.error.completeRequired': 'Completa los campos requeridos antes de continuar.',
    'reg.error.fixFollowing': 'Corrige lo siguiente:',
    'reg.error.documentNumberMin': 'El número de documento debe tener al menos 5 caracteres.',
    'reg.error.documentNumberMax': 'El número de documento no puede superar 24 caracteres.',
    'reg.error.serverFieldNotSupported':
      'El servidor no reconoce el campo «{{field}}». Reinicia el backend con la última versión del código.',
    'reg.error.documentType': 'Selecciona un tipo de documento válido.',
    'reg.error.documentNumber': 'Introduce un número de documento válido.',
    'reg.error.birthDate': 'Ingresa una fecha de nacimiento válida.',
    'reg.error.birthDateUnderage': 'Debes ser mayor de edad (18 años o más).',
    'reg.error.gender': 'Selecciona un género.',
    'reg.error.nationality': 'La nacionalidad es obligatoria.',
    'reg.error.nationalityInvalid': 'Selecciona un país de nacionalidad válido.',
    'reg.error.areaRequired': 'La zona es obligatoria.',
    'reg.error.countryCode': 'El país es obligatorio.',
    'reg.error.countryCodeFormat': 'Usa el código de país de 2 letras (ej. CO, ES).',
    'reg.error.cityInvalid': 'Selecciona un departamento o provincia válido.',
    'reg.error.areaTooShort': 'El barrio debe tener al menos 2 caracteres.',
    'reg.error.areaTooLong': 'El barrio no puede superar 120 caracteres.',
    'country.colombia': 'Colombia',
    'country.argentina': 'Argentina',
    'reg.error.network': 'Sin conexión. Comprueba tu red e inténtalo de nuevo.',
    'reg.error.emailVerification': 'Verifica tu email antes de continuar.',
    'reg.error.phoneVerification': 'Verifica tu teléfono antes de continuar.',
    'reg.error.contactVerification': 'Verifica al menos email o teléfono antes de continuar.',

    'verify.title': 'Verifica tu contacto',
    'verify.hint.worker': 'Para WORKER, el teléfono verificado es obligatorio (MVP).',
    'verify.hint.client': 'Para CLIENT, puedes continuar con 1 verificación (recomendado completar ambas).',
    'verify.otp.email': 'OTP Email',
    'verify.otp.sms': 'OTP SMS',
    'verify.status.verified': 'Verificado',
    'verify.status.pending': 'Pendiente',

    'location.title': 'Ubicación mínima',
    'location.hint': 'No capturamos dirección exacta durante el onboarding.',
    'location.city': 'Departamento / Provincia',
    'location.area': 'Zona',
    'location.municipality': 'Municipio',
    'location.selectMunicipality': 'Selecciona un municipio',
    'location.municipalityHint': 'Primero elige el departamento o provincia.',
    'location.neighborhood': 'Barrio',
    'location.neighborhoodPlaceholder': 'Ej. El Poblado, Palermo, Centro',
    'location.neighborhoodHint': 'Primero elige el municipio; luego escribe tu barrio.',
    'reg.error.municipalityRequired': 'El municipio es obligatorio.',
    'reg.error.municipalityInvalid': 'Selecciona un municipio válido.',
    'location.country': 'País',
    'location.selectCountry': 'Selecciona un país',
    'location.selectCity': 'Selecciona una ciudad',
    'location.cityHint': 'Primero elige un país para ver las ciudades disponibles.',
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
    'personal.gender': 'Género',
    'personal.nationality': 'Nacionalidad',
    'personal.selectNationality': 'Selecciona tu nacionalidad',
    'personal.docRequiredWorker': 'Obligatorio para WORKER.',

    'doc.dni': 'DNI',
    'doc.nie': 'NIE',
    'doc.passport': 'Pasaporte',
    'doc.cc': 'Cédula de ciudadanía',
    'gender.male': 'Masculino',
    'gender.female': 'Femenino',
    'gender.other': 'Otro',
    'gender.pnts': 'Prefiero no decirlo',
  },
  en: {
    'brand.name': 'Anyjobs',
    'nav.inicio': 'Home',
    'nav.solicitudes': 'Requests',
    'nav.ubicacion': 'Location',
    'nav.contacto': 'Contact',
    'nav.menuOpen': 'Open main menu',
    'nav.menuClose': 'Close main menu',
    'nav.mobileMenuHeading': 'Menu',
    'nav.language': 'Language',
    'cta.publicar': 'Post / Contact',
    'home.bottomNav.ariaLabel': 'Quick shortcuts',
    'home.bottomNav.perfil': 'Profile',
    'home.bottomNav.mapa': 'View map',
    'home.bottomNav.perfilOpenLogin': 'Profile — sign in',
    'lang.es': 'ES',
    'lang.en': 'EN',

    // Auth
    'auth.login': 'Sign in',
    'auth.loginSubmitting': 'Signing in…',
    'auth.loginFailed':
      'The credentials entered are not valid or sign-in was not possible.',
    'auth.loginNetworkError': 'No connection or the server did not respond. Please try again.',
    'auth.loginUnavailable': 'Sign-in is not possible right now. Please try again later.',
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

    'role.client': 'Client',
    'role.worker': 'Worker',

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
    'error.docTypeRequired': 'Select a document type.',
    'error.docNumberRequired': 'Enter the document number.',
    'error.birthDateRequired': 'Enter your date of birth.',
    'error.categoriesRequired': 'Select at least one category.',
    'reg.checkingAvailability': 'Checking availability…',
    'reg.resumeHint': 'We resumed your registration in progress. You can continue where you left off.',
    'reg.error.unexpected': 'We could not complete registration. Please try again.',
    'reg.error.validation': 'Please check the form data.',
    'reg.error.completeRequired': 'Complete the required fields before continuing.',
    'reg.error.fixFollowing': 'Please fix the following:',
    'reg.error.documentNumberMin': 'Document number must be at least 5 characters.',
    'reg.error.documentNumberMax': 'Document number cannot exceed 24 characters.',
    'reg.error.serverFieldNotSupported':
      'The server does not recognize the field "{{field}}". Restart the backend with the latest code.',
    'reg.error.documentType': 'Select a valid document type.',
    'reg.error.documentNumber': 'Enter a valid document number.',
    'reg.error.birthDate': 'Enter a valid date of birth.',
    'reg.error.birthDateUnderage': 'You must be at least 18 years old.',
    'reg.error.gender': 'Select a gender.',
    'reg.error.nationality': 'Nationality is required.',
    'reg.error.nationalityInvalid': 'Select a valid country of nationality.',
    'reg.error.areaRequired': 'Area is required.',
    'reg.error.countryCode': 'Country is required.',
    'reg.error.countryCodeFormat': 'Use a 2-letter country code (e.g. CO, ES).',
    'reg.error.cityInvalid': 'Select a valid department or province.',
    'reg.error.areaTooShort': 'Neighborhood must be at least 2 characters.',
    'reg.error.areaTooLong': 'Neighborhood cannot exceed 120 characters.',
    'country.colombia': 'Colombia',
    'country.argentina': 'Argentina',
    'reg.error.network': 'No connection. Check your network and try again.',
    'reg.error.emailVerification': 'Verify your email before continuing.',
    'reg.error.phoneVerification': 'Verify your phone before continuing.',
    'reg.error.contactVerification': 'Verify email or phone before continuing.',

    'verify.title': 'Verify your contact',
    'verify.hint.worker': 'For WORKER, a verified phone is required (MVP).',
    'verify.hint.client': 'For CLIENT, you can continue with 1 verification (recommended both).',
    'verify.otp.email': 'Email OTP',
    'verify.otp.sms': 'SMS OTP',
    'verify.status.verified': 'Verified',
    'verify.status.pending': 'Pending',

    'location.title': 'Minimum location',
    'location.hint': 'We do not capture exact address during onboarding.',
    'location.city': 'Department / Province',
    'location.area': 'Area',
    'location.municipality': 'Municipality',
    'location.selectMunicipality': 'Select a municipality',
    'location.municipalityHint': 'Choose department or province first.',
    'location.neighborhood': 'Neighborhood',
    'location.neighborhoodPlaceholder': 'e.g. El Poblado, Palermo, Downtown',
    'location.neighborhoodHint': 'Choose municipality first, then type your neighborhood.',
    'reg.error.municipalityRequired': 'Municipality is required.',
    'reg.error.municipalityInvalid': 'Select a valid municipality.',
    'location.country': 'Country',
    'location.selectCountry': 'Select a country',
    'location.selectCity': 'Select a city',
    'location.cityHint': 'Choose a country first to see available cities.',
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
    'personal.gender': 'Gender',
    'personal.nationality': 'Nationality',
    'personal.selectNationality': 'Select your nationality',
    'personal.docRequiredWorker': 'Required for WORKER.',

    'doc.dni': 'DNI',
    'doc.nie': 'NIE',
    'doc.passport': 'Passport',
    'doc.cc': 'Citizenship ID (Colombia)',
    'gender.male': 'Male',
    'gender.female': 'Female',
    'gender.other': 'Other',
    'gender.pnts': 'Prefer not to say',
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

