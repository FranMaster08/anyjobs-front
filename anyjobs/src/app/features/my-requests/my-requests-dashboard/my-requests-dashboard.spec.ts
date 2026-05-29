import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { MyRequestsDashboard } from './my-requests-dashboard';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';
import { OpenRequestsService } from '../../open-requests/open-requests.service';

describe('MyRequestsDashboard', () => {
  let fixture: ComponentFixture<MyRequestsDashboard>;

  function myRequestsTabs(root: HTMLElement): HTMLButtonElement[] {
    return Array.from(root.querySelectorAll('.myRequestsTab')) as HTMLButtonElement[];
  }

  function configure(opts: {
    loggedIn: boolean;
    listByUser: () => ReturnType<ProposalsService['listByUser']>;
    listByRequest?: () => ReturnType<ProposalsService['listByRequest']>;
    getOpenRequestDetail?: () => ReturnType<OpenRequestsService['getOpenRequestDetail']>;
    listMyOpenRequests?: () => ReturnType<OpenRequestsService['listMyOpenRequests']>;
  }): void {
    const authState = signal(opts.loggedIn);

    TestBed.configureTestingModule({
      imports: [MyRequestsDashboard],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            vm: computed(() => ({
              session: null,
              isLoggedIn: authState(),
              user: authState()
                ? {
                    id: 'user_1',
                    fullName: 'Test User',
                    email: 'test@anyjobs.test',
                    roles: ['CLIENT'],
                    phoneNumber: '+34123456789',
                    emailVerified: true,
                    phoneVerified: false,
                    status: 'ACTIVE',
                    countryCode: 'ES',
                    city: 'Madrid',
                    area: 'Centro',
                    createdAt: new Date().toISOString(),
                  }
                : null,
            })),
          },
        },
        {
          provide: ProposalsService,
          useValue: {
            listByUser: opts.listByUser,
            listByRequest: opts.listByRequest ?? (() => of([])),
          },
        },
        {
          provide: OpenRequestsService,
          useValue: {
            getOpenRequestDetail:
              opts.getOpenRequestDetail ??
              (() => of({ id: 'req-1001', title: 'Solicitud', excerpt: 'x', images: [] })),
            listMyOpenRequests:
              opts.listMyOpenRequests ?? (() => of({ items: [], nextPage: null, hasMore: false })),
          },
        },
      ],
    });
  }

  it('should create', async () => {
    configure({
      loggedIn: false,
      listByUser: () => of([]),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show login gating when user is not logged in', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: false,
      listByUser: () => of([]),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesión');
    expect(compiled.querySelector('.tabs')).toBeNull();
  });

  it('renderiza ambas pestañas con la pestaña "Publicadas por mí" activa por defecto', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listByUser: () => of([]),
      listMyOpenRequests: () => of({ items: [], nextPage: null, hasMore: false }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = myRequestsTabs(compiled);
    expect(tabs.length).toBe(2);
    expect(tabs[0]?.textContent).toContain('Publicadas por mí');
    expect(tabs[1]?.textContent).toContain('Postulé a estas');
    expect(tabs[0]?.classList.contains('myRequestsTab--active')).toBe(true);
    expect(tabs[1]?.classList.contains('myRequestsTab--active')).toBe(false);
  });

  it('muestra empty state propio en "Publicadas por mí" cuando no hay solicitudes propias', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listByUser: () => of([]),
      listMyOpenRequests: () => of({ items: [], nextPage: null, hasMore: false }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No has publicado solicitudes todavía.');
  });

  it('muestra estado de error en "Publicadas por mí" cuando listMyOpenRequests falla', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listByUser: () => of([]),
      listMyOpenRequests: () => throwError(() => new Error('boom')),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No pudimos cargar tus solicitudes publicadas');
  });

  it('al cambiar a la pestaña "Postulé a estas" muestra su empty state', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listByUser: () => of([]),
      listMyOpenRequests: () => of({ items: [], nextPage: null, hasMore: false }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const appliedTab = myRequestsTabs(compiled)[1];
    appliedTab?.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Todavía no postulaste a ninguna solicitud.');
  });

  it('renderiza items publicados con chip de estado y contador en la tab', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listByUser: () => of([]),
      listMyOpenRequests: () =>
        of({
          items: [
            {
              id: 'req-pub-1',
              lifecycleStatus: 'ACTIVE',
              excerpt: 'Mi solicitud publicada',
              tags: ['Limpieza'],
              locationLabel: 'Madrid · Centro',
              budgetLabel: '€80',
              publishedAtLabel: 'Hace 1 hora',
            },
          ],
          nextPage: null,
          hasMore: false,
        }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mi solicitud publicada');
    expect(compiled.textContent).toContain('Activo');

    const publishedTab = myRequestsTabs(compiled)[0];
    expect(publishedTab?.textContent?.replace(/\s+/g, ' ')).toContain('Publicadas por mí 1');
  });

  it('oculta acciones en postulación cuando la solicitud está cancelada', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listMyOpenRequests: () => of({ items: [], nextPage: null, hasMore: false }),
      listByUser: () =>
        of([
          {
            id: 'prop-1',
            requestId: 'req-cancelled',
            userId: 'user-1',
            author: { name: 'Yo', subtitle: '' },
            whoAmI: 'x',
            message: 'x',
            estimate: '€10',
            createdAt: new Date().toISOString(),
            status: 'SENT',
          },
        ]),
      getOpenRequestDetail: () =>
        of({
          id: 'req-cancelled',
          lifecycleStatus: 'CANCELLED',
          title: 'Cancelada',
          excerpt: 'x',
          images: [],
        }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const appliedTab = myRequestsTabs(fixture.nativeElement as HTMLElement)[1];
    appliedTab?.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const appliedList = compiled.querySelector('[aria-label="Solicitudes a las que postulé"]');
    expect(appliedList).toBeTruthy();
    expect(appliedList!.textContent).toContain('Cancelada');
    expect(appliedList!.querySelector('.itemActions')).toBeNull();
    expect(appliedList!.querySelector('a[href*="/solicitudes/req-cancelled"]')).toBeNull();
  });
});
