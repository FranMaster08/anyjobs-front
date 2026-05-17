import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { NOTIFICATIONS_API_URL } from '../../shared/notifications/notifications.api';
import { HeaderNotificationsBellComponent } from './header-notifications-bell';

describe(HeaderNotificationsBellComponent.name, () => {
  let fixture: ComponentFixture<HeaderNotificationsBellComponent>;
  let http: HttpTestingController;
  let router: Router;
  const baseUrl = 'http://test/notifications';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderNotificationsBellComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NOTIFICATIONS_API_URL, useValue: baseUrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderNotificationsBellComponent);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/unread-count`).flush({ count: 0 });
  });

  afterEach(() => {
    http.verify();
  });

  it('shows badge when unread count is greater than zero', () => {
    http.expectOne(`${baseUrl}/unread-count`).flush({ count: 2 });
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.notifBellBadge');
    expect(badge?.textContent?.trim()).toBe('2');
  });

  it('shows empty state when list is empty', () => {
    fixture.nativeElement.querySelector('.notifBellBtn').click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === baseUrl && r.method === 'GET').flush({ items: [], meta: {} });
    http.expectOne(`${baseUrl}/unread-count`).flush({ count: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No tienes notificaciones');
  });

  it('navigates to solicitud on item click', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.nativeElement.querySelector('.notifBellBtn').click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === baseUrl && r.method === 'GET').flush({
      items: [
        {
          id: 'n1',
          type: 'PROPOSAL_RECEIVED',
          title: 'Nueva postulación',
          message: 'Alguien se postuló',
          entityType: 'open_request',
          entityId: 'req-99',
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: {},
    });
    http.expectOne(`${baseUrl}/unread-count`).flush({ count: 1 });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.notifItem').click();
    http.expectOne(`${baseUrl}/n1/read`).flush({
      id: 'n1',
      type: 'PROPOSAL_RECEIVED',
      title: 'Nueva postulación',
      message: 'Alguien se postuló',
      entityType: 'open_request',
      entityId: 'req-99',
      isRead: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/solicitudes', 'req-99']);
  });
});
