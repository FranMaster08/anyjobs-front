import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { OpenRequestProposalCompose } from './open-request-proposal-compose';
import { OpenRequestsService } from '../open-requests.service';
import { ProposalsService } from '../../../shared/proposals/proposals.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';

describe('OpenRequestProposalCompose', () => {
  let fixture: ComponentFixture<OpenRequestProposalCompose>;

  function configure(opts: {
    loggedIn: boolean;
    getOpenRequestDetail: () => ReturnType<OpenRequestsService['getOpenRequestDetail']>;
    sendProposal?: () => ReturnType<ProposalsService['sendProposal']>;
  }): void {
    const authState = signal(opts.loggedIn);

    TestBed.configureTestingModule({
      imports: [OpenRequestProposalCompose],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'req-1001' })),
          },
        },
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
          provide: OpenRequestsService,
          useValue: {
            getOpenRequestDetail: opts.getOpenRequestDetail,
          },
        },
        {
          provide: ProposalsService,
          useValue: {
            sendProposal:
              opts.sendProposal ??
              (() =>
                of({
                  id: 'proposal_1',
                  requestId: 'req-1001',
                  userId: 'user_1',
                  whoAmI: 'Yo',
                  message: 'Mensaje de prueba suficientemente largo',
                  estimate: '€100',
                  createdAt: new Date().toISOString(),
                  status: 'SENT',
                })),
          },
        },
      ],
    });
  }

  it('should create', async () => {
    configure({
      loggedIn: false,
      getOpenRequestDetail: () => of({ id: 'req-1001', title: 'Solicitud', excerpt: 'x', images: [] }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(OpenRequestProposalCompose);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show login gating when user is not logged in', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: false,
      getOpenRequestDetail: () => of({ id: 'req-1001', title: 'Solicitud', excerpt: 'x', images: [] }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(OpenRequestProposalCompose);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Necesitas una cuenta');
  });

  it('should keep submit disabled when form is invalid', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      getOpenRequestDetail: () => of({ id: 'req-1001', title: 'Solicitud', excerpt: 'x', images: [] }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(OpenRequestProposalCompose);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const submit = compiled.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    expect(submit).toBeTruthy();
    expect(submit?.disabled).toBe(true);
  });

  it('should show error state if request cannot be loaded', async () => {
    TestBed.resetTestingModule();
    configure({
      loggedIn: true,
      getOpenRequestDetail: () => throwError(() => new Error('fail')),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(OpenRequestProposalCompose);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudo cargar');
  });
});

