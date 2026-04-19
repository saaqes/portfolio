import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'builder',
    loadComponent: () => import('./pages/builder/builder.component').then(m => m.BuilderComponent),
    canActivate: [authGuard]
  },
  {
    path: 'builder/:pageId',
    loadComponent: () => import('./pages/builder/builder.component').then(m => m.BuilderComponent),
    canActivate: [authGuard]
  },
  {
    path: 'p/:username/:slug',
    loadComponent: () => import('./pages/page-view/page-view.component').then(m => m.PageViewComponent)
  },
  { path: '**', redirectTo: '' }
];
