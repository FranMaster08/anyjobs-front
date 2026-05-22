import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PasswordRecovery } from './password-recovery';
import { AuthApi } from '../../../shared/api/auth.api';
import { I18nService } from '../../../shared/i18n/i18n.service';

describe('PasswordRecovery', () => {
  it('blocks reset submit when passwords do not match', async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordRecovery],
      providers: [
        provideRouter([]),
        {
          provide: AuthApi,
          useValue: { forgotPassword: vi.fn(), resetPassword: vi.fn() },
        },
        I18nService,
      ],
    }).compileComponents();

    const fixture: ComponentFixture<PasswordRecovery> = TestBed.createComponent(PasswordRecovery);
    const component = fixture.componentInstance;
    (component as unknown as { mode: { set: (v: string) => void } }).mode.set('reset');

    component['resetForm'].setValue({ password: 'Aa1!aaaa', passwordConfirm: 'Bb2!bbbb' });
    component['resetForm'].markAllAsTouched();
    fixture.detectChanges();

    expect(component['resetForm'].invalid).toBe(true);
    expect(component['resetForm'].errors?.['passwordMismatch']).toBe(true);
  });

  it('shows success message after forgot-password', async () => {
    const forgotPassword = vi.fn().mockReturnValue(
      of({ message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' }),
    );

    await TestBed.configureTestingModule({
      imports: [PasswordRecovery],
      providers: [
        provideRouter([]),
        { provide: AuthApi, useValue: { forgotPassword, resetPassword: vi.fn() } },
        I18nService,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PasswordRecovery);
    const component = fixture.componentInstance;
    component['requestForm'].setValue({ email: 'user@example.com' });
    component['submitRequest']();
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(component['successMessage']()).toContain('enlace');
    });
  });
});
