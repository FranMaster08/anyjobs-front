import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken, signal } from '@angular/core';

import { SiteConfig } from './site-config.models';

export const SITE_CONFIG_URL = new InjectionToken<string>('SITE_CONFIG_URL', {
  providedIn: 'root',
  factory: () => '/mock/site.mock.json',
});

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(SITE_CONFIG_URL);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly config = signal<SiteConfig | null>(null);

  private hasLoaded = false;

  load(): void {
    if (this.hasLoaded) return;
    this.hasLoaded = true;

    this.loading.set(true);
    this.error.set(null);

    this.http.get<SiteConfig>(this.url).subscribe({
      next: (cfg) => {
        this.config.set(cfg);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la configuración del sitio.');
        this.loading.set(false);
      },
    });
  }
}

