import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { NEVER, of, throwError } from 'rxjs';

import { OpenRequestsLanding } from './open-requests-landing';
import { OpenRequestsService } from '../open-requests.service';
import { SiteConfigService } from '../../../shared/site-config/site-config.service';

describe('OpenRequestsLanding', () => {
  let component: OpenRequestsLanding;
  let fixture: ComponentFixture<OpenRequestsLanding>;

  function configure(service: Pick<OpenRequestsService, 'listOpenRequests'>): void {
    TestBed.configureTestingModule({
      imports: [OpenRequestsLanding],
      providers: [
        provideRouter([]),
        { provide: OpenRequestsService, useValue: service },
        {
          provide: SiteConfigService,
          useValue: {
            loading: signal(false),
            error: signal(null),
            config: signal(null),
            load: () => undefined,
          },
        },
      ],
    });
  }

  beforeEach(async () => {
    configure({
      listOpenRequests: () => NEVER,
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(OpenRequestsLanding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show skeletons while loading', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.card-skeleton').length).toBeGreaterThan(0);
  });

  it('should show empty state when no items', async () => {
    TestBed.resetTestingModule();
    configure({
      listOpenRequests: () => of({ items: [], nextPage: null, hasMore: false }),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(OpenRequestsLanding);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No hay solicitudes abiertas');
  });

  it('should show error state when request fails', async () => {
    TestBed.resetTestingModule();
    configure({
      listOpenRequests: () => throwError(() => new Error('fail')),
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(OpenRequestsLanding);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar');
  });

  it('should retry after error', async () => {
    TestBed.resetTestingModule();
    let calls = 0;
    configure({
      listOpenRequests: () => {
        calls += 1;
        if (calls === 1) return throwError(() => new Error('fail'));
        return of({
          items: [{ id: '1', excerpt: 'Hola' }],
          nextPage: null,
          hasMore: false,
        });
      },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(OpenRequestsLanding);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const retryBtn = compiled.querySelector('button') as HTMLButtonElement | null;
    expect(retryBtn).toBeTruthy();
    retryBtn?.click();

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(calls).toBe(2);
    expect(compiled.querySelectorAll('app-open-request-card').length).toBe(1);
  });
});

