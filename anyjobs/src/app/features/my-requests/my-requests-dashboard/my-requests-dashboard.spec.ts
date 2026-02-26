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

  function configure(opts: {
    loggedIn: boolean;
    listByUser: () => ReturnType<ProposalsService['listByUser']>;
    listByRequest?: () => ReturnType<ProposalsService['listByRequest']>;
    getOpenRequestDetail?: () => ReturnType<OpenRequestsService['getOpenRequestDetail']>;
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
  });

  it('should show empty state when user has no proposals', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listByUser: () => of([]),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Todavía no postulaste');
  });

  it('should show error state when loading fails', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      listByUser: () => throwError(() => new Error('fail')),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MyRequestsDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar');
  });
});

