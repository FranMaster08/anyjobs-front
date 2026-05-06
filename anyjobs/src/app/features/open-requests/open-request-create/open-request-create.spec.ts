import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { OpenRequestCreate, parseTags } from './open-request-create';
import { OpenRequestsService } from '../open-requests.service';
import { CreateOpenRequestInput, OpenRequestDetail } from '../open-requests.models';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { AuthSession } from '../../../shared/auth/auth.models';

interface AuthVm {
  session: AuthSession | null;
  isLoggedIn: boolean;
  user: AuthSession['user'] | null;
}

function buildAuthMock(initial: AuthVm): {
  service: Pick<AuthSessionService, 'vm' | 'clear' | 'setSession'>;
  vmSignal: ReturnType<typeof signal<AuthVm>>;
  clearSpy: ReturnType<typeof vi.fn>;
} {
  const vmSignal = signal(initial);
  const clearSpy = vi.fn(() =>
    vmSignal.set({ session: null, isLoggedIn: false, user: null }),
  );
  return {
    vmSignal,
    clearSpy,
    service: {
      vm: computed(() => vmSignal()),
      clear: clearSpy,
      setSession: vi.fn(),
    },
  };
}

interface ServiceMock {
  createOpenRequest: (input: CreateOpenRequestInput) => Observable<OpenRequestDetail>;
}

function configure(
  authVm: AuthVm,
  serviceMock: ServiceMock,
): {
  fixture: ComponentFixture<OpenRequestCreate>;
  component: OpenRequestCreate;
  authClearSpy: ReturnType<typeof vi.fn>;
  routerNavigateSpy: ReturnType<typeof vi.fn>;
} {
  const auth = buildAuthMock(authVm);

  TestBed.configureTestingModule({
    imports: [OpenRequestCreate],
    providers: [
      provideRouter([]),
      { provide: AuthSessionService, useValue: auth.service },
      { provide: OpenRequestsService, useValue: serviceMock },
    ],
  });

  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

  const fixture = TestBed.createComponent(OpenRequestCreate);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    authClearSpy: auth.clearSpy,
    routerNavigateSpy: navigateSpy,
  };
}

const validInput: CreateOpenRequestInput = {
  title: 'Limpieza profunda',
  excerpt: 'Necesito limpieza',
  description: 'Descripción suficientemente larga para validar el campo.',
  tags: ['Limpieza'],
  locationLabel: 'Barcelona · Eixample',
  budgetLabel: '€60',
  contactPhone: '+34600111222',
  contactEmail: 'cliente@example.com',
};

const validDetail: OpenRequestDetail = {
  id: 'req-abc',
  title: validInput.title,
  excerpt: validInput.excerpt,
  description: validInput.description,
  images: [],
};

function fillForm(component: OpenRequestCreate, partial: Partial<CreateOpenRequestInput & { tagsInput: string }> = {}): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = (component as any).form;
  form.patchValue({
    title: validInput.title,
    excerpt: validInput.excerpt,
    description: validInput.description,
    tagsInput: 'Limpieza',
    locationLabel: validInput.locationLabel,
    budgetLabel: validInput.budgetLabel,
    contactPhone: validInput.contactPhone,
    contactEmail: validInput.contactEmail,
    ...partial,
  });
}

function fakeFileInputChangeEvent(files: File[]): Event {
  const target = {
    files: files.length > 0 ? files : null,
    value: '',
  } as unknown as HTMLInputElement;
  return { target } as unknown as Event;
}

describe('parseTags', () => {
  it('normaliza, recorta y deduplica', () => {
    expect(parseTags('Limpieza, plomería ,  Limpieza ,  ')).toEqual(['Limpieza', 'plomería']);
  });

  it('devuelve [] para entrada vacía', () => {
    expect(parseTags('')).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });
});

describe('OpenRequestCreate', () => {
  it('renderiza el bloque "no-auth" cuando no hay sesión', () => {
    const { fixture } = configure(
      { session: null, isLoggedIn: false, user: null },
      { createOpenRequest: () => of(validDetail) },
    );
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Inicia sesión para publicar una solicitud');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('renderiza el formulario cuando hay sesión', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    const { fixture } = configure(
      { session, isLoggedIn: true, user: session.user },
      { createOpenRequest: () => of(validDetail) },
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).not.toBeNull();
  });

  it('al hacer submit con campos requeridos vacíos lista los campos pendientes y no envía', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    let postCalls = 0;
    const { fixture, component } = configure(
      { session, isLoggedIn: true, user: session.user },
      {
        createOpenRequest: () => {
          postCalls += 1;
          return of(validDetail);
        },
      },
    );

    const submitBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submitBtn).not.toBeNull();
    expect(submitBtn!.disabled).toBe(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).submit();

    expect(postCalls).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const missing = (component as any).missingFields() as readonly string[];
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain('Título');
    expect(missing).toContain('Descripción');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).state()).toBe('error');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).errorMessage()).toMatch(/Faltan? .* (campo|campos)/i);
  });

  it('rechaza contactEmail inválido', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    const { component } = configure(
      { session, isLoggedIn: true, user: session.user },
      { createOpenRequest: () => of(validDetail) },
    );
    fillForm(component, { contactEmail: 'no-es-email' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).form.controls.contactEmail.errors).toMatchObject({ email: true });
  });

  it('rechaza locationLabel con UUID embebido', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    const { component } = configure(
      { session, isLoggedIn: true, user: session.user },
      { createOpenRequest: () => of(validDetail) },
    );
    fillForm(component, {
      locationLabel: '4f1a2b3c-9d2e-4a7b-8c6d-1234567890ab · Sevilla · Triana',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).form.controls.locationLabel.errors).toMatchObject({
      uuidNotAllowed: true,
    });
  });

  it('añade imágenes en varios turnos sin borrar las anteriores', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    const { component } = configure(
      { session, isLoggedIn: true, user: session.user },
      { createOpenRequest: () => of(validDetail) },
    );

    const f1 = new File([new Uint8Array([137, 80])], 'a.png', { type: 'image/png' });
    const f2 = new File([new Uint8Array([137, 80])], 'b.png', { type: 'image/png' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).onImageFilesSelected(fakeFileInputChangeEvent([f1]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).selectedImageFiles()).toEqual([f1]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).onImageFilesSelected(fakeFileInputChangeEvent([f2]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).selectedImageFiles()).toEqual([f1, f2]);
  });

  it('envía imageFiles cuando hay imágenes seleccionadas', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    let captured: CreateOpenRequestInput | null = null;
    const { component } = configure(
      { session, isLoggedIn: true, user: session.user },
      {
        createOpenRequest: (input: CreateOpenRequestInput) => {
          captured = input;
          return of(validDetail);
        },
      },
    );
    fillForm(component);
    const png = new File([new Uint8Array([137, 80])], 'foto.png', { type: 'image/png' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).selectedImageFiles.set([png]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).submit();
    expect(captured).not.toBeNull();
    expect(captured!.imageFiles).toEqual([png]);
  });

  it("normaliza tags 'a, b, a, ' a ['a','b'] en el body enviado", () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    let captured: CreateOpenRequestInput | null = null;
    const { component } = configure(
      { session, isLoggedIn: true, user: session.user },
      {
        createOpenRequest: (input: CreateOpenRequestInput) => {
          captured = input;
          return of(validDetail);
        },
      },
    );
    fillForm(component, { tagsInput: 'a, b, a, ' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).submit();
    expect(captured).not.toBeNull();
    expect(captured!.tags).toEqual(['a', 'b']);
  });

  it('navega a /solicitudes/<id> al cerrar el modal de éxito', async () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    const { component, routerNavigateSpy } = configure(
      { session, isLoggedIn: true, user: session.user },
      { createOpenRequest: () => of(validDetail) },
    );
    fillForm(component);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).submit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).closeSuccess();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/solicitudes', 'req-abc']);
  });

  it('respuesta 401 limpia sesión y muestra mensaje de sesión expirada', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    const err = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const { component, authClearSpy } = configure(
      { session, isLoggedIn: true, user: session.user },
      { createOpenRequest: () => throwError(() => err) },
    );
    fillForm(component);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).submit();
    expect(authClearSpy).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).errorMessage()).toBe('Tu sesión expiró, vuelve a iniciar sesión');
  });

  it('respuesta 403 mantiene sesión y muestra mensaje de permisos', () => {
    const session: AuthSession = {
      token: 't',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u', fullName: 'X', email: 'u@x.com', roles: [] as any },
    };
    const err = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    const { component, authClearSpy } = configure(
      { session, isLoggedIn: true, user: session.user },
      { createOpenRequest: () => throwError(() => err) },
    );
    fillForm(component);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).submit();
    expect(authClearSpy).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).errorMessage()).toBe(
      'Tu cuenta no tiene permiso para publicar solicitudes',
    );
  });
});
