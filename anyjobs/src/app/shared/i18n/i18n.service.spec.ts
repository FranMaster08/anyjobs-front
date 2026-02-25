import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.removeItem('anyjobs.lang');
    TestBed.resetTestingModule();
  });

  it('defaults to es', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(I18nService);

    expect(service.lang()).toBe('es');
  });

  it('persists selected language', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(I18nService);

    service.setLang('en');

    expect(service.lang()).toBe('en');
    expect(localStorage.getItem('anyjobs.lang')).toBe('en');
  });

  it('falls back to default language when a key is missing in current language', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(I18nService);

    service.setLang('en');

    expect(service.t('example.only_es')).toBe('Solo en español');
  });
});

