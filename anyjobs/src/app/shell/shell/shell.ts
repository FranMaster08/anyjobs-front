import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AppLang, I18nService } from '../../shared/i18n/i18n.service';
import { SiteConfigService } from '../../shared/site-config/site-config.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly site = inject(SiteConfigService);

  protected readonly t = (key: string) => this.i18n.t(key);

  constructor() {
    this.site.load();

    // Router scroll behavior:
    // - If URL has fragment: scroll to anchor (if present)
    // - Else: scroll to top
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const fragment = this.router.parseUrl(this.router.url).fragment;

        if (fragment) {
          // Wait one tick so the target element can render after route navigation.
          setTimeout(() => {
            const el = document.getElementById(fragment);
            if (el) {
              el.scrollIntoView({ block: 'start', behavior: 'smooth' });
              return;
            }
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          }, 0);
          return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
  }

  protected onLangChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? 'es';
    if (value === 'es' || value === 'en') {
      this.i18n.setLang(value);
    }
  }
}
