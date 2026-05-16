import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authBearerInterceptor } from './shared/api/auth-bearer.interceptor';
import { authCredentialsInterceptor } from './shared/api/auth-credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authCredentialsInterceptor, authBearerInterceptor])),
    provideRouter(routes),
  ],
};
