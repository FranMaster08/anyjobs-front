import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { authBearerInterceptor } from './shared/api/auth-bearer.interceptor';
import { authCredentialsInterceptor } from './shared/api/auth-credentials.interceptor';
import { authUnauthorizedInterceptor } from './shared/api/auth-unauthorized.interceptor';
import { AuthSessionService } from './shared/auth/auth-session.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(AuthSessionService).validatePersistedSession()),
    provideHttpClient(
      withInterceptors([
        authCredentialsInterceptor,
        authBearerInterceptor,
        authUnauthorizedInterceptor,
      ]),
    ),
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'disabled',
      }),
    ),
  ],
};
