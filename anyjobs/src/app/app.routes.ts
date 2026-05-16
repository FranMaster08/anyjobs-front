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
        path: 'reels',
        loadComponent: () =>
          import('./features/reels-feed/reels-feed/reels-feed').then((m) => m.ReelsFeed),
      },
      {
        path: 'registro',
        loadChildren: () =>
          import('./features/auth/registration/registration.routes').then((m) => m.registrationRoutes),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'usuarios/:userId',
        loadComponent: () => import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'mis-solicitudes',
        loadComponent: () =>
          import('./features/my-requests/my-requests-dashboard/my-requests-dashboard').then(
            (m) => m.MyRequestsDashboard,
          ),
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
            path: 'nueva',
            loadComponent: () =>
              import('./features/open-requests/open-request-create/open-request-create').then(
                (m) => m.OpenRequestCreate,
              ),
          },
          {
            path: ':id/propuesta',
            loadComponent: () =>
              import('./features/open-requests/open-request-proposal-compose/open-request-proposal-compose').then(
                (m) => m.OpenRequestProposalCompose,
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
