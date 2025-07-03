import { Routes } from '@angular/router';
import { EditorRedirectGuard } from './guards/documents-redirect.guard';
import { BlankComponent } from './common/components/blank/blank-component';
import { SpreadsheetRedirectGuard } from './guards/spreadsheet-redirect.guard';
import { AuthGuard } from './guards/auth.guard';
import { PdfRedirectGuard } from './guards/pdf-redirect.guard';

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
        path: 'docs',
        canActivate: [AuthGuard],
        children: [
          {
            path: '',
            canActivate: [EditorRedirectGuard],
            component: BlankComponent,
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./components/documents/documents.component').then(
                (c) => c.DocumentsComponent,
              ),
            data: {
              height: 'calc(100vh - 128px - 16px)',
              width: '812px',
            },
          },
        ],
        title: 'Documents',
        data: { menu: true },
      },
      {
        path: 'spreadsheets',
        canActivate: [AuthGuard],
        children: [
          {
            path: '',
            canActivate: [SpreadsheetRedirectGuard],
            component: BlankComponent,
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./components/spreadsheets/spreadsheets.component').then(
                (c) => c.SpreadsheetsComponent,
              ),
          },
        ],
        title: 'Sheets',
        data: { menu: true },
      },
      {
        path: 'pdf',
        canActivate: [AuthGuard],
        children: [
          {
            path: '',
            canActivate: [PdfRedirectGuard],
            component: BlankComponent,
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./components/pdf/pdf.component').then(
                (c) => c.PdfComponent,
              ),
            data: {
              height: 'calc(100vh - 128px - 16px)',
              width: '812px',
            },
          },
        ],
        title: 'Pdf',
        data: { menu: true },
      },

      {
        path: 'missing-document',
        loadComponent: () =>
          import(
            './components/missing-document/missing-document.component'
          ).then((c) => c.MissingDocumentComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home/error404',
  },
];
