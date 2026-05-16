import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { OpenRequestDetail } from './open-request-detail';
import { OpenRequestsService } from '../open-requests.service';
import { OpenRequestDetail as OpenRequestDetailModel } from '../open-requests.models';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';
import { OpenRequestsAnalyticsService } from '../open-requests-analytics.service';
import { UserApi } from '../../../shared/api/user.api';

const ownerId = '00000000-0000-0000-0000-00000000aa01';
const otherId = '00000000-0000-0000-0000-00000000bb02';

const demoDetail: OpenRequestDetailModel = {
  id: 'req-test',
  ownerUserId: ownerId,
  title: 'Solicitud test',
  excerpt: 'Resumen',
  description: 'Descripción larga de prueba para el detalle.',
  publishedAtLabel: 'Hace 2 días',
  provider: { name: 'Cliente', badge: 'NUEVO', subtitle: 'Solicitud publicada' },
  reputation: 0,
  reviewsCount: 0,
  images: [],
};

function buildAuthMock(userId: string | null, isLoggedIn: boolean) {
  const vmSignal = signal({
    session: null,
    isLoggedIn,
    user: userId ? { id: userId, email: 'u@test.com', name: 'Usuario' } : null,
  });
  return {
    vm: computed(() => vmSignal()),
    clear: vi.fn(),
    setSession: vi.fn(),
  };
}

function createFixture(authUserId: string | null): ComponentFixture<OpenRequestDetail> {
  const auth = buildAuthMock(authUserId, Boolean(authUserId));

  TestBed.configureTestingModule({
    imports: [OpenRequestDetail],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ id: 'req-test' })),
          snapshot: { paramMap: convertToParamMap({ id: 'req-test' }) },
        },
      },
      { provide: AuthSessionService, useValue: auth },
      {
        provide: OpenRequestsService,
        useValue: {
          getOpenRequestDetail: () => of(demoDetail),
        },
      },
      {
        provide: ProposalsService,
        useValue: { listByRequest: () => of([]) },
      },
      {
        provide: OpenRequestsAnalyticsService,
        useValue: { track: vi.fn() },
      },
      {
        provide: UserApi,
        useValue: {
          getPublicProfile: () =>
            of({
              userId: ownerId,
              fullName: 'María García',
              roles: ['CLIENT'],
              visibility: 'public' as const,
              metrics: { openRequestsPublished: 1, proposalsSent: 0 },
            }),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(OpenRequestDetail);
  fixture.detectChanges();
  return fixture;
}

describe('OpenRequestDetail', () => {
  it('no muestra Postulantes para visitante sin sesión', () => {
    const fixture = createFixture(null);
    expect(fixture.nativeElement.textContent).not.toContain('Postulantes');
  });

  it('no muestra Postulantes para usuario autenticado que no es el owner', () => {
    const fixture = createFixture(otherId);
    expect(fixture.nativeElement.textContent).not.toContain('Postulantes');
  });

  it('muestra Postulantes para el owner autenticado', () => {
    const fixture = createFixture(ownerId);
    expect(fixture.nativeElement.textContent).toContain('Postulantes');
  });

  it('no muestra el UUID en la descripción', () => {
    const fixture = createFixture(null);
    expect(fixture.nativeElement.textContent).not.toContain('req-test');
    expect(fixture.nativeElement.textContent).toContain('Publicado por');
    expect(fixture.nativeElement.textContent).toContain('María García');
  });

  it('oculta Postulantes si el dueño recibe 401 al listar', () => {
    const auth = buildAuthMock(ownerId, true);
    const clearSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [OpenRequestDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'req-test' })),
            snapshot: { paramMap: convertToParamMap({ id: 'req-test' }) },
          },
        },
        {
          provide: AuthSessionService,
          useValue: { vm: auth.vm, setSession: auth.setSession, clear: clearSpy },
        },
        {
          provide: OpenRequestsService,
          useValue: { getOpenRequestDetail: () => of(demoDetail) },
        },
        {
          provide: ProposalsService,
          useValue: {
            listByRequest: () =>
              throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'No autenticado.' } })),
          },
        },
        { provide: OpenRequestsAnalyticsService, useValue: { track: vi.fn() } },
        {
          provide: UserApi,
          useValue: {
            getPublicProfile: () =>
              of({
                userId: ownerId,
                fullName: 'María García',
                roles: ['CLIENT'],
                visibility: 'public' as const,
                metrics: { openRequestsPublished: 1, proposalsSent: 0 },
              }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(OpenRequestDetail);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Postulantes');
    expect(clearSpy).toHaveBeenCalled();
  });
});
