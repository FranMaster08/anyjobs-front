import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CreateOpenRequestInput } from './open-requests.models';
import { OPEN_REQUESTS_API_URL, OpenRequestsService } from './open-requests.service';

describe('OpenRequestsService.createOpenRequest', () => {
  function setup(apiUrl: string): { service: OpenRequestsService; httpMock: HttpTestingController } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OPEN_REQUESTS_API_URL, useValue: apiUrl },
        OpenRequestsService,
      ],
    });

    return {
      service: TestBed.inject(OpenRequestsService),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  const baseInput: CreateOpenRequestInput = {
    title: 'Limpieza profunda',
    excerpt: 'Necesito limpieza',
    description: 'Descripción suficientemente larga para validar el campo.',
    tags: ['Limpieza'],
    locationLabel: 'Barcelona · Eixample',
    budgetLabel: '€60',
    contactPhone: '+34600111222',
    contactEmail: 'cliente@example.com',
  };

  it('envía POST al apiUrl con el body esperado y normaliza la respuesta', () => {
    const { service, httpMock } = setup('https://api.example.com/open-requests');

    let received: { id: string; title: string } | null = null;
    service.createOpenRequest(baseInput).subscribe((detail) => {
      received = { id: detail.id, title: detail.title };
    });

    const req = httpMock.expectOne('https://api.example.com/open-requests');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Limpieza profunda',
      excerpt: 'Necesito limpieza',
      description: 'Descripción suficientemente larga para validar el campo.',
      tags: ['Limpieza'],
      locationLabel: 'Barcelona · Eixample',
      budgetLabel: '€60',
      contactPhone: '+34600111222',
      contactEmail: 'cliente@example.com',
    });

    req.flush({
      id: 'req-123',
      title: 'Limpieza profunda',
      excerpt: 'Necesito limpieza',
      description: 'Descripción suficientemente larga para validar el campo.',
      tags: ['Limpieza'],
      locationLabel: 'Barcelona · Eixample',
      budgetLabel: '€60',
      contactPhone: '+34600111222',
      contactEmail: 'cliente@example.com',
    });

    expect(received).toEqual({ id: 'req-123', title: 'Limpieza profunda' });

    httpMock.verify();
  });

  it('incluye imageUrl/imageAlt en el body solo si tienen contenido', () => {
    const { service, httpMock } = setup('https://api.example.com/open-requests');

    service
      .createOpenRequest({
        ...baseInput,
        imageUrl: 'https://example.com/img.jpg',
        imageAlt: 'foto',
      })
      .subscribe();

    const req = httpMock.expectOne('https://api.example.com/open-requests');
    expect(req.request.body).toMatchObject({
      imageUrl: 'https://example.com/img.jpg',
      imageAlt: 'foto',
    });
    req.flush({ id: 'x', images: [] });

    httpMock.verify();
  });

  it('omite imageUrl/imageAlt cuando vienen vacías', () => {
    const { service, httpMock } = setup('https://api.example.com/open-requests');

    service
      .createOpenRequest({
        ...baseInput,
        imageUrl: '   ',
        imageAlt: '',
      })
      .subscribe();

    const req = httpMock.expectOne('https://api.example.com/open-requests');
    const body = req.request.body as Record<string, unknown>;
    expect(body['imageUrl']).toBeUndefined();
    expect(body['imageAlt']).toBeUndefined();
    req.flush({ id: 'x', images: [] });

    httpMock.verify();
  });

  it('en modo mock emite error sin disparar POST', () => {
    const { service, httpMock } = setup('/mock/open-requests.json');

    let captured: unknown = null;
    service.createOpenRequest(baseInput).subscribe({
      next: () => {
        captured = 'next';
      },
      error: (err: Error) => {
        captured = err.message;
      },
    });

    httpMock.expectNone(() => true);
    expect(captured).toBe('createOpenRequest no está disponible en modo mock');

    httpMock.verify();
  });
});

describe('OpenRequestsService.listMyOpenRequests', () => {
  function setup(apiUrl: string): { service: OpenRequestsService; httpMock: HttpTestingController } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OPEN_REQUESTS_API_URL, useValue: apiUrl },
        OpenRequestsService,
      ],
    });

    return {
      service: TestBed.inject(OpenRequestsService),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  it('envía GET a <apiUrl>/mine con page y pageSize y normaliza la respuesta', () => {
    const { service, httpMock } = setup('https://api.example.com/open-requests');

    let received: { itemsCount: number; firstId: string | undefined; hasMore: boolean } | null = null;
    service.listMyOpenRequests({ page: 1, pageSize: 20 }).subscribe((res) => {
      received = {
        itemsCount: res.items.length,
        firstId: res.items[0]?.id,
        hasMore: res.hasMore,
      };
    });

    const req = httpMock.expectOne((r) => r.url === 'https://api.example.com/open-requests/mine');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('20');

    req.flush({
      items: [
        {
          id: 'req-1',
          excerpt: 'Mi solicitud',
          tags: ['Limpieza'],
          locationLabel: 'Barcelona',
          publishedAtLabel: 'Hace 1h',
          budgetLabel: '€50',
          imageUrl: 'https://example.com/i.jpg',
          imageAlt: 'foto',
        },
      ],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasNextPage: false, nextPage: null },
      nextPage: null,
      hasMore: false,
    });

    expect(received).toEqual({ itemsCount: 1, firstId: 'req-1', hasMore: false });

    httpMock.verify();
  });

  it('en modo mock emite error sin disparar GET', () => {
    const { service, httpMock } = setup('/mock/open-requests.json');

    let captured: unknown = null;
    service.listMyOpenRequests({ page: 1, pageSize: 12 }).subscribe({
      next: () => {
        captured = 'next';
      },
      error: (err: Error) => {
        captured = err.message;
      },
    });

    httpMock.expectNone(() => true);
    expect(captured).toBe('listMyOpenRequests no está disponible en modo mock');

    httpMock.verify();
  });
});
