import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CreateProposalInput } from './proposals.models';
import { PROPOSALS_API_URL, ProposalsService } from './proposals.service';

describe('ProposalsService (backend real)', () => {
  function setup(): { service: ProposalsService; httpMock: HttpTestingController } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PROPOSALS_API_URL,
          useValue: 'https://api.example.com/proposals',
        },
        ProposalsService,
      ],
    });

    return {
      service: TestBed.inject(ProposalsService),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  const proposalBody: CreateProposalInput = {
    requestId: 'req-1',
    userId: 'usr-1',
    authorName: 'María',
    authorSubtitle: 'Pro',
    whoAmI: 'Limpio ventanas.',
    message: 'Puedo el martes.',
    estimate: '€40',
  };

  const apiProposal = {
    id: 'p1',
    requestId: 'req-1',
    userId: 'usr-1',
    author: { name: 'María', subtitle: 'Profesional' },
    whoAmI: 'Limpio ventanas.',
    message: 'Puedo el martes.',
    estimate: '€40',
    createdAt: '2026-03-01T12:00:00.000Z',
    status: 'SENT' as const,
  };

  it('listByRequest parsea items+meta y ordena por fecha', () => {
    const { service, httpMock } = setup();

    let received: string[] = [];
    service.listByRequest('req-1').subscribe((items) => {
      received = items.map((p) => p.id);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'https://api.example.com/proposals' && r.params.get('requestId') === 'req-1',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      items: [
        { ...apiProposal, id: 'older', createdAt: '2026-01-01T12:00:00.000Z' },
        { ...apiProposal, id: 'newer', createdAt: '2026-02-01T12:00:00.000Z' },
      ],
      meta: {
        totalItems: 2,
        page: 1,
        pageSize: 100,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: null,
        previousPage: null,
      },
    });

    expect(received).toEqual(['newer', 'older']);
    httpMock.verify();
  });

  it('sendProposal acepta 201 y mapea author anidado', () => {
    const { service, httpMock } = setup();

    let received: { id: string; authorName: string | undefined } | null = null;
    service.sendProposal(proposalBody).subscribe((p) => {
      received = { id: p.id, authorName: p.author?.name };
    });

    const req = httpMock.expectOne('https://api.example.com/proposals');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      requestId: 'req-1',
      authorName: 'María',
      authorSubtitle: 'Pro',
      whoAmI: 'Limpio ventanas.',
      message: 'Puedo el martes.',
      estimate: '€40',
    });
    req.flush(apiProposal, { status: 201, statusText: 'Created' });

    expect(received).toEqual({ id: 'p1', authorName: 'María' });
    httpMock.verify();
  });
});
