import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { I18nService } from '../../../shared/i18n/i18n.service';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly auth = inject(AuthSessionService);
  protected readonly vm = this.auth.vm;
  protected readonly i18n = inject(I18nService);
  protected readonly t = (key: string) => this.i18n.t(key);

  protected readonly initials = computed(() => {
    const name = this.vm().user?.fullName ?? '';
    const ch = name.trim().slice(0, 1);
    return ch ? ch.toUpperCase() : 'U';
  });

  protected readonly tokenPreview = computed(() => {
    const token = this.vm().session?.token ?? '';
    if (!token) return '—';
    return token.length > 18 ? `${token.slice(0, 10)}…${token.slice(-6)}` : token;
  });

  protected logout(): void {
    this.auth.clear();
  }
}

