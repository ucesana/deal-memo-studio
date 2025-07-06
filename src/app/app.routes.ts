import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home/welcome',
  },
  {
    path: 'home',
    pathMatch: 'full',
    redirectTo: 'home/welcome',
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home').then((c) => c.Home),
    title: 'Deal Memo Studio',
    children: [
      {
        path: 'welcome',
        loadComponent: () =>
          import('./components/welcome/welcome').then((c) => c.Welcome),
        title: 'Welcome - Deal Memo Studio',
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./components/privacy/privacy').then((c) => c.Privacy),
        title: 'Privacy Policy - Deal Memo Studio',
      },
      {
        path: 'terms',
        loadComponent: () =>
          import('./components/terms/terms').then((c) => c.Terms),
        title: 'Terms of Service - Deal Memo Studio',
      },

      {
        path: 'error404',
        loadComponent: () =>
          import('./components/error404/error404.component').then(
            (c) => c.Error404Component,
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (c) => c.DashboardComponent,
      ),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./components/login/login.component').then(
            (c) => c.LoginComponent,
          ),
      },
      {
        path: 'create-deal-memos',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import(
            './components/deal-memo-creator/deal-memo-creator.component'
          ).then((c) => c.DealMemoCreator),
        title: 'Deal Memos',
        data: { menu: true, reuseRoute: true },
      },
      {
        path: 'create-deal-memos/:action',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import(
            './components/deal-memo-creator/deal-memo-creator.component'
          ).then((c) => c.DealMemoCreator),
        data: { reuseRoute: true },
      },
      {
        path: 'drive',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/drive/drive.component').then(
            (c) => c.DriveComponent,
          ),
        title: 'My Drive',
        data: { menu: true },
      },
      {
        path: 'drive/:id',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/drive/drive.component').then(
            (c) => c.DriveComponent,
          ),
        title: 'My Drive',
        data: { menu: false },
      },

      {
        path: 'docs',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/documents/documents.component').then(
            (c) => c.DocumentsComponent,
          ),
        data: {
          height: 'calc(100vh - 128px - 16px)',
          width: '812px',
          menu: true,
        },
        title: 'Documents',
      },
      {
        path: 'docs/:id',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/documents/documents.component').then(
            (c) => c.DocumentsComponent,
          ),
        data: {
          height: 'calc(100vh - 128px - 16px)',
          width: '812px',
          menu: false,
        },
        title: 'Documents',
      },
      {
        path: 'spreadsheets',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/spreadsheets/spreadsheets.component').then(
            (c) => c.SpreadsheetsComponent,
          ),
        title: 'Sheets',
        data: { menu: true },
      },
      {
        path: 'spreadsheets/:id',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/spreadsheets/spreadsheets.component').then(
            (c) => c.SpreadsheetsComponent,
          ),
        title: 'Sheets',
        data: { menu: false },
      },
      {
        path: 'pdf',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/pdf/pdf.component').then((c) => c.PdfComponent),
        data: {
          height: 'calc(100vh - 128px - 16px)',
          width: '812px',
          menu: true,
        },
        title: 'Pdf',
      },
      {
        path: 'pdf/:id',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./components/pdf/pdf.component').then((c) => c.PdfComponent),
        data: {
          height: 'calc(100vh - 128px - 16px)',
          width: '812px',
          menu: false,
        },
        title: 'Pdf',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home/error404',
  },
];
