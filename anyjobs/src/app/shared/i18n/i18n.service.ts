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

