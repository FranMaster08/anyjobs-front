import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';

import { Profile } from './profile';
import { UserApi } from '../../../shared/api/user.api';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import type { AuthSession } from '../../../shared/auth/auth.models';
import type { UserPrivateProfileDto, UserPublicProfileDto } from '../../../shared/api/user-profile.models';
import { LocationGeographyService } from '../../../shared/location/location-geography.service';
import { buildLocationCatalogResponse } from '../../../shared/location/location-geography.data';
import { I18nService } from '../../../shared/i18n/i18n.service';

interface AuthVm {
  session: AuthSession | null;
  isLoggedIn: boolean;
  user: AuthSession['user'] | null;
}

const privateProfile: UserPrivateProfileDto = {
  userId: 'user-1',
  fullName: 'Legal Name',
  displayName: 'Visible Name',
  email: 'user@example.com',
  roles: ['WORKER', 'CLIENT'],
  visibility: 'private',
  countryCode: 'AR',
  city: 'Ciudad Autónoma de Buenos Aires',
  municipality: 'Ciudad Autónoma de Buenos Aires',
  area: 'Palermo',
  workerCategories: ['limpieza'],
  metrics: { openRequestsPublished: 0, proposalsSent: 0 },
};

const publicProfile: UserPublicProfileDto = {
  userId: 'user-2',
  fullName: 'Other User',
  roles: ['CLIENT'],
  visibility: 'public',
  metrics: { openRequestsPublished: 0, proposalsSent: 0 },
};

function buildAuthMock(initial: AuthVm) {
  const vmSignal = signal(initial);
  return {
    vmSignal,
    service: {
      vm: computed(() => vmSignal()),
      clear: vi.fn(),
      setSession: vi.fn(),
    },
  };
}

function configure(authVm: AuthVm, userApiMock: Partial<UserApi>) {
  const auth = buildAuthMock(authVm);
  const geography = {
    ensureCatalog: () => of(buildLocationCatalogResponse()),
    loadDivisionsForCountry: () => of([]),
    loadMunicipalitiesForDivision: () => of([]),
    divisions: () => ['Ciudad Autónoma de Buenos Aires'],
    municipalities: () => ['Ciudad Autónoma de Buenos Aires'],
    divisionsLoaded: signal({}),
    municipalitiesLoaded: signal({}),
  };

  TestBed.configureTestingModule({
    imports: [Profile],
    providers: [
      provideRouter([]),
      { provide: AuthSessionService, useValue: auth.service },
      { provide: UserApi, useValue: userApiMock },
      { provide: LocationGeographyService, useValue: geography },
      {
        provide: I18nService,
        useValue: { t: (key: string) => key, lang: () => 'es' },
      },
    ],
  });

  const fixture = TestBed.createComponent(Profile);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, auth };
}

describe('Profile', () => {
  it('muestra botón Editar perfil solo en perfil propio', () => {
    const getMyProfile = vi.fn(() => of(privateProfile));
    const { fixture, component } = configure(
      {
        session: { token: 't', user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['WORKER'] } },
        isLoggedIn: true,
        user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['WORKER'] },
      },
      { getMyProfile, getPublicProfile: vi.fn(() => of(publicProfile)), updateProfile: vi.fn(() => of(void 0)) },
    );

    component['privateProfile'].set(privateProfile);
    component['visibilityMode'].set('private');
    component['viewState'].set('ready');
    fixture.detectChanges();

    const html = fixture.nativeElement.textContent as string;
    expect(html).toContain('Editar perfil');
  });

  it('no muestra botón Editar perfil en perfil público ajeno', () => {
    const { fixture, component } = configure(
      {
        session: { token: 't', user: { id: 'user-1', fullName: 'Me', email: 'u@e.com', roles: ['CLIENT'] } },
        isLoggedIn: true,
        user: { id: 'user-1', fullName: 'Me', email: 'u@e.com', roles: ['CLIENT'] },
      },
      {
        getMyProfile: vi.fn(() => of(privateProfile)),
        getPublicProfile: vi.fn(() => of(publicProfile)),
        updateProfile: vi.fn(() => of(void 0)),
      },
    );

    component['publicProfile'].set(publicProfile);
    component['privateProfile'].set(null);
    component['visibilityMode'].set('public');
    component['viewState'].set('ready');
    fixture.detectChanges();

    const html = fixture.nativeElement.textContent as string;
    expect(html).not.toContain('Editar perfil');
  });

  it('submit de edición llama updateProfile con payload esperado', () => {
    const updateProfile = vi.fn(() => of(void 0));
    const { fixture, component } = configure(
      {
        session: { token: 't', user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['WORKER', 'CLIENT'] } },
        isLoggedIn: true,
        user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['WORKER', 'CLIENT'] },
      },
      { getMyProfile: vi.fn(() => of(privateProfile)), getPublicProfile: vi.fn(() => of(publicProfile)), updateProfile },
    );

    component['privateProfile'].set(privateProfile);
    component['visibilityMode'].set('private');
    component['viewState'].set('ready');
    component['openEditProfile']();
    fixture.detectChanges();

    const edit = fixture.nativeElement.querySelector('app-profile-edit');
    expect(edit).toBeTruthy();

    const form: HTMLFormElement | null = fixture.nativeElement.querySelector('.profileEditForm');
    expect(form).toBeTruthy();
    form?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(updateProfile).toHaveBeenCalled();
  });

  it('cancelar edición no invoca updateProfile', () => {
    const updateProfile = vi.fn(() => of(void 0));
    const { fixture, component } = configure(
      {
        session: { token: 't', user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['CLIENT'] } },
        isLoggedIn: true,
        user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['CLIENT'] },
      },
      { getMyProfile: vi.fn(() => of(privateProfile)), getPublicProfile: vi.fn(() => of(publicProfile)), updateProfile },
    );

    component['privateProfile'].set(privateProfile);
    component['visibilityMode'].set('private');
    component['viewState'].set('ready');
    component['openEditProfile']();
    fixture.detectChanges();

    component['closeEditProfile']();
    fixture.detectChanges();

    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('formulario de edición no incluye campos protegidos', () => {
    const { fixture, component } = configure(
      {
        session: { token: 't', user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['CLIENT'] } },
        isLoggedIn: true,
        user: { id: 'user-1', fullName: 'Legal Name', email: 'u@e.com', roles: ['CLIENT'] },
      },
      { getMyProfile: vi.fn(() => of(privateProfile)), getPublicProfile: vi.fn(() => of(publicProfile)), updateProfile: vi.fn(() => of(void 0)) },
    );

    component['privateProfile'].set(privateProfile);
    component['visibilityMode'].set('private');
    component['viewState'].set('ready');
    component['openEditProfile']();
    fixture.detectChanges();

    const formHtml = (fixture.nativeElement.querySelector('.profileEditForm') as HTMLElement | null)
      ?.innerHTML;
    expect(formHtml).toBeTruthy();
    expect(formHtml).not.toContain('formControlName="email"');
    expect(formHtml).not.toContain('id="profileEmail"');
    expect(formHtml).not.toContain('Teléfono');
  });
});
