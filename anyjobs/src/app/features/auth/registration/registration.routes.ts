import { Routes } from '@angular/router';

export const registrationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./registration/registration').then((m) => m.Registration),
  },
];

