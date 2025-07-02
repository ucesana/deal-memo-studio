import { Routes } from '@angular/router';
import { Error404Component } from './components/error404/error404.component';
import { EditorRedirectGuard } from './guards/documents-redirect.guard';
import { BlankComponent } from './common/components/blank/blank-component';
import { MissingDocumentComponent } from './components/missing-document/missing-document.component';
import { SpreadsheetRedirectGuard } from './guards/spreadsheet-redirect.guard';
import { AuthGuard } from './guards/auth.guard';
import { PdfRedirectGuard } from './guards/pdf-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'welcome',
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./components/welcome/welcome.component').then(
        (c) => c.WelcomeComponent,
      ),
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
    path: 'drive/:parentId',
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
          import('./components/pdf/pdf.component').then((c) => c.PdfComponent),
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
    path: 'create-deal-memos',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./components/deal-memo-creator/deal-memo-creator.component').then(
        (c) => c.DealMemoCreator,
      ),
    title: 'Deal Memos',
    data: { menu: true, reuseRoute: true },
  },
  {
    path: 'create-deal-memos/:action',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./components/deal-memo-creator/deal-memo-creator.component').then(
        (c) => c.DealMemoCreator,
      ),
    data: { reuseRoute: true },
  },

  {
    path: 'missing-document',
    loadComponent: () =>
      import('./components/missing-document/missing-document.component').then(
        (c) => c.MissingDocumentComponent,
      ),
  },

  {
    path: '**',
    loadComponent: () =>
      import('./components/error404/error404.component').then(
        (c) => c.Error404Component,
      ),
  },
];
