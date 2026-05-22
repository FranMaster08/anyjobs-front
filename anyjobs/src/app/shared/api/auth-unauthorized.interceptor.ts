import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthSessionService } from '../auth/auth-session.service';
import { requiresAuthenticatedRoute } from '../auth/auth-private-routes';
import {
  isAuthenticationFailureResponse,
  shouldSkipSessionExpirationHandling,
} from './auth-unauthorized.utils';

export const authUnauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  if (shouldSkipSessionExpirationHandling(req.url)) {
    return next(req);
  }

  const auth = inject(AuthSessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || !isAuthenticationFailureResponse(err)) {
        return throwError(() => err);
      }

      if (auth.vm().isLoggedIn || auth.hasPersistedCredentials()) {
        auth.invalidateSession('expired', {
          redirect: requiresAuthenticatedRoute(router.url),
          notify: true,
        });
      }

      return throwError(() => err);
    }),
  );
};
