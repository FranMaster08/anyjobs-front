import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
      },
      {
        path: 'registro',
        loadChildren: () =>
          import('./features/auth/registration/registration.routes').then((m) => m.registrationRoutes),
      },
      {
        path: 'solicitudes',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/open-requests/open-requests-landing/open-requests-landing').then(
                (m) => m.OpenRequestsLanding,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/open-requests/open-request-detail/open-request-detail').then(
                (m) => m.OpenRequestDetail,
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
