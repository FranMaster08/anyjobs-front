import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { NEVER, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Shell } from './shell';
import { SiteConfigService } from '../../shared/site-config/site-config.service';
import { AuthApi } from '../../shared/api/auth.api';
import { AuthSessionService } from '../../shared/auth/auth-session.service';
import { AuthSession } from '../../shared/auth/auth.models';
import { LoginResponse } from '../../shared/api/auth.models';

interface ShellLoginTestView {
  openLogin(): void;
  submitLogin(): void;
  goToRegistration(event: Event): void;
  isLoginOpen(): boolean;
  loginError(): string | null;
  loginForm: {
    setValue(value: { email: string; password: string }): void;
  };
}

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let authState: ReturnType<
    typeof signal<{
      session: AuthSession | null;
      isLoggedIn: boolean;
      user: AuthSession['user'] | null;
    }>
  >;
  let loginSpy: ReturnType<typeof vi.fn>;
  let setSessionSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authState = signal({ session: null, isLoggedIn: false, user: null });
    loginSpy = vi.fn();
    setSessionSpy = vi.fn((session: AuthSession) => {
      authState.set({ session, isLoggedIn: true, user: session.user });
    });

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        {
          provide: AuthApi,
          useValue: {
            login: loginSpy,
          },
        },
        {
          provide: AuthSessionService,
          useValue: {
            vm: authState,
            setSession: setSessionSpy,
            clear: vi.fn(() => authState.set({ session: null, isLoggedIn: false, user: null })),
          },
        },
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
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should persist authenticated session after successful login', () => {
    const response: LoginResponse = {
      token: 'token-123',
      user: {
        id: 'user-1',
        fullName: 'Usuario Demo',
        email: 'demo@anyjobs.test',
        roles: ['CLIENT'],
      },
    };
    loginSpy.mockReturnValue(of(response));

    const shell = component as unknown as ShellLoginTestView;

    shell.openLogin();
    shell.loginForm.setValue({ email: 'demo@anyjobs.test', password: '1234' });
    shell.submitLogin();

    expect(loginSpy).toHaveBeenCalledWith({ email: 'demo@anyjobs.test', password: '1234' });
    expect(setSessionSpy).toHaveBeenCalledWith(response);
    expect(authState().isLoggedIn).toBe(true);
    expect(shell.isLoginOpen()).toBe(false);
  });

  it('shows unified safe message for HTTP login failure', async () => {
    loginSpy.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const shell = component as unknown as ShellLoginTestView;
    shell.openLogin();
    shell.loginForm.setValue({ email: 'a@b.co', password: '1234' });
    shell.submitLogin();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(shell.loginError()).toBe(
      'Las credenciales ingresadas no son válidas o no fue posible iniciar sesión.',
    );
  });

  it('navigates to /registro when goToRegistration is triggered', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const shell = component as unknown as ShellLoginTestView;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');

    shell.openLogin();
    shell.goToRegistration(event);
    await Promise.resolve();
    await fixture.whenStable();

    expect(preventSpy).toHaveBeenCalled();
    expect(shell.isLoginOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/registro');
  });

  it('does not start a second login request while the first is in flight', () => {
    loginSpy.mockReturnValue(NEVER);
    const shell = component as unknown as ShellLoginTestView;
    shell.openLogin();
    shell.loginForm.setValue({ email: 'demo@anyjobs.test', password: '1234' });
    shell.submitLogin();
    shell.submitLogin();
    fixture.detectChanges();
    expect(loginSpy).toHaveBeenCalledTimes(1);
  });
});
