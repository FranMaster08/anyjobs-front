import { HttpInterceptorFn } from '@angular/common/http';

/** Envía cookies de flujo de registro (`aj_reg_flow`) en rutas /auth. */
export const authCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth')) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
