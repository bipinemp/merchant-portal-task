import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'applications/new',
        loadComponent: () => import('./features/application/components/application-wizard').then(m => m.ApplicationWizardComponent),
        canActivate: [roleGuard('SALES', 'ADMIN')]
      },
      {
        path: 'applications/:id/edit',
        loadComponent: () => import('./features/application/components/application-wizard').then(m => m.ApplicationWizardComponent),
        canActivate: [roleGuard('SALES', 'ADMIN')]
      },
      {
        path: 'applications/:id',
        loadComponent: () => import('./features/application/components/application-detail/application-detail').then(m => m.ApplicationDetailComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
