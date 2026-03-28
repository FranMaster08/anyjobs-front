import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Shell } from './shell';
import { SiteConfigService } from '../../shared/site-config/site-config.service';
import { AuthApi } from '../../shared/api/auth.api';
import { AuthSessionService } from '../../shared/auth/auth-session.service';
import { AuthSession } from '../../shared/auth/auth.models';
import { LoginResponse } from '../../shared/api/auth.models';

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

    const shell = component as unknown as {
      openLogin(): void;
      submitLogin(): void;
      isLoginOpen(): boolean;
      loginForm: {
        setValue(value: { email: string; password: string }): void;
      };
    };

    shell.openLogin();
    shell.loginForm.setValue({ email: 'demo@anyjobs.test', password: '1234' });
    shell.submitLogin();

    expect(loginSpy).toHaveBeenCalledWith({ email: 'demo@anyjobs.test', password: '1234' });
    expect(setSessionSpy).toHaveBeenCalledWith(response);
    expect(authState().isLoggedIn).toBe(true);
    expect(shell.isLoginOpen()).toBe(false);
  });
});
