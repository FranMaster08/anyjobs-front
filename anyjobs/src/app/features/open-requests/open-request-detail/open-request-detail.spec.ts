import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';

import { OpenRequestDetail } from './open-request-detail';
import { OpenRequestsService } from '../open-requests.service';
import { OpenRequestDetail as OpenRequestDetailModel } from '../open-requests.models';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { OpenRequestsAnalyticsService } from '../open-requests-analytics.service';
import { UserApi } from '../../../shared/api/user.api';
import { ProposalsService } from '../../../shared/proposals/proposals.service';

const ownerId = '00000000-0000-0000-0000-00000000aa01';
const otherId = '00000000-0000-0000-0000-00000000bb02';

const demoDetail: OpenRequestDetailModel = {
  id: 'req-test',
  lifecycleStatus: 'ACTIVE',
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

function createFixture(
  authUserId: string | null,
  proposals: readonly { requestId: string }[] = [],
): ComponentFixture<OpenRequestDetail> {
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
      {
        provide: ProposalsService,
        useValue: {
          listByRequest: () =>
            of(
              proposals.map((_, i) => ({
                id: `prop-${i}`,
                requestId: 'req-test',
                estimate: '100',
                message: 'Hola',
                whoAmI: 'Yo',
              })),
            ),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(OpenRequestDetail);
  fixture.detectChanges();
  return fixture;
}

describe('OpenRequestDetail', () => {
  it('no muestra la sección de postulantes para visitante sin sesión', () => {
    const fixture = createFixture(null);
    expect(fixture.nativeElement.textContent).not.toContain('Ver postulantes');
  });

  it('no muestra acciones de postulantes para usuario autenticado que no es el owner', () => {
    const fixture = createFixture(otherId);
    expect(fixture.nativeElement.textContent).not.toContain('Ver postulantes');
  });

  it('muestra enlace a Mis solicitudes para el owner autenticado', () => {
    const fixture = createFixture(ownerId, [{ requestId: 'req-test' }, { requestId: 'req-test' }]);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Ver postulantes (2)');
    expect(text).toContain('Volver a Mis solicitudes');
    expect(text).toContain('Cancelar esta solicitud');
  });

  it('deshabilita postulantes cuando el contador es cero', () => {
    const fixture = createFixture(ownerId, []);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Sin postulantes aún');
    const disabledBtn = fixture.nativeElement.querySelector(
      'button.btn[disabled]',
    ) as HTMLButtonElement | null;
    expect(disabledBtn?.textContent?.trim()).toBe('Sin postulantes aún');
  });

  it('no muestra el UUID en la descripción', () => {
    const fixture = createFixture(null);
    expect(fixture.nativeElement.textContent).not.toContain('req-test');
    expect(fixture.nativeElement.textContent).toContain('Publicado por');
    expect(fixture.nativeElement.textContent).toContain('María García');
  });

  it('muestra Condiciones y recursos cuando el detalle las incluye', () => {
    TestBed.resetTestingModule();
    const detailWithConditions: OpenRequestDetailModel = {
      ...demoDetail,
      workConditions: {
        ownToolsRequired: 'yes',
        additionalInstructions: 'Usar ascensor B',
      },
    };

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
        { provide: AuthSessionService, useValue: buildAuthMock(null, false) },
        {
          provide: OpenRequestsService,
          useValue: { getOpenRequestDetail: () => of(detailWithConditions) },
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
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Condiciones y recursos');
    expect(text).toContain('Herramientas propias requeridas');
    expect(text).toContain('Sí');
    expect(text).toContain('Instrucciones adicionales');
    expect(text).toContain('Usar ascensor B');
  });

  it('no muestra Condiciones y recursos en solicitudes legacy sin datos', () => {
    const fixture = createFixture(null);
    expect(fixture.nativeElement.textContent).not.toContain('Condiciones y recursos');
  });

  it('muestra Cancelar esta solicitud al owner cuando está activa', () => {
    const fixture = createFixture(ownerId);
    expect(fixture.nativeElement.textContent).toContain('Cancelar esta solicitud');
  });

  it('no muestra Cancelar solicitud cuando ya está cerrada', () => {
    TestBed.resetTestingModule();
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
        { provide: AuthSessionService, useValue: buildAuthMock(ownerId, true) },
        {
          provide: OpenRequestsService,
          useValue: {
            getOpenRequestDetail: () => of({ ...demoDetail, lifecycleStatus: 'CANCELLED' }),
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
        {
          provide: ProposalsService,
          useValue: { listByRequest: () => of([]) },
        },
      ],
    });
    const fixture = TestBed.createComponent(OpenRequestDetail);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Esta solicitud está cerrada');
    expect(fixture.nativeElement.textContent).not.toContain('Cancelar esta solicitud');
  });
});
