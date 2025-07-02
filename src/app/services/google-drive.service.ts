import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  concatAll,
  finalize,
  forkJoin,
  from,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { GoogleAuthService } from './google-auth.service';
import { filter, map, take } from 'rxjs/operators';
import { SnackService } from '../common/services/snack.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GoogleDocsService } from './google-docs.service';
import { MatDialog } from '@angular/material/dialog';
import { SpinnerDialog } from '../common/components/spinner-dialog/spinner-dialog';

declare const gapi: any;

export interface DriveSearchQuery {
  names?: string[];
  parentId?: string;
  mimeTypes?: string[];
  trashed?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleDriveService {
  private static readonly API_NAME = 'drive';
  private static readonly API_VERSION = 'v3';
  private static readonly API_BASE = 'https://www.googleapis.com/drive/v3';

  private readonly googleAuthService: GoogleAuthService =
    inject(GoogleAuthService);
  private readonly googleDocsService = inject(GoogleDocsService);
  private readonly snackService = inject(SnackService);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);

  private isDriveApiLoaded = false;
  private driveApiLoadedPromise: Promise<any> = new Promise((resolve) => {});

  // @ts-ignore
  listFilesSubject: Subject<gapi.client.drive.File[]> = new BehaviorSubject([]);

  constructor() {}

  loadDriveApi(): Observable<any> {
    if (!this.googleAuthService.isAuthenticated()) {
      console.warn('Token not found');
      return throwError(() => new Error('Not signed in to Google API client.'));
    }

    if (!this.isDriveApiLoaded) {
      this.driveApiLoadedPromise = gapi.client.load(
        GoogleDriveService.API_NAME,
        GoogleDriveService.API_VERSION,
      );
      this.isDriveApiLoaded = true;
    }
    return from(
      this.driveApiLoadedPromise.then((result) => {
        return result;
      }),
    ).pipe(
      catchError((response) => this.googleAuthService.handleError(response)),
    );
  }

  listFiles(query: any): Observable<gapi.client.drive.File[]> {
    return this.loadDriveApi().pipe(
      switchMap(
        () =>
          from(
            gapi.client.drive.files.list({
              pageSize: 100,
              fields:
                'nextPageToken, files(id, name, kind, mimeType, parents, driveId)',
              ...query,
            }),
          ) as Observable<
            gapi.client.Response<{
              files: gapi.client.drive.File[];
            }>
          >,
      ),
      take(1),
      map((response) => response.result.files),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  loadFiles(query = {}): void {
    this.listFiles(query)
      .pipe(
        take(1),
        catchError((response) => {
          this.snackService.openSnackBar(response.result.error);
          this.listFilesSubject.next([]);
          return this.googleAuthService.handleError(response);
        }),
      )
      .subscribe((files: gapi.client.drive.File[]) => {
        this.listFilesSubject.next(files);
      });
  }

  retrieveFiles(): Observable<gapi.client.drive.File[]> {
    return this.listFilesSubject.asObservable();
  }

  driveSearchQuery({
    names,
    parentId,
    mimeTypes,
    trashed = false,
  }: DriveSearchQuery): string {
    const parts = [];
    if (names?.length)
      parts.push(`(${names.map((name) => `name = '${name}'`).join(' or ')})`);
    if (parentId) parts.push(`'${parentId}' in parents`);
    if (mimeTypes?.length)
      parts.push(
        `(${mimeTypes.map((type) => `mimeType = '${type}'`).join(' or ')})`,
      );
    parts.push(`trashed = ${trashed ? 'true' : 'false'}`);
    return parts.join(' and ');
  }

  exportFileAsBinary(fileId: string) {
    const accessToken = gapi.auth.getToken().access_token;
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get(url, { headers, responseType: 'blob' });
  }

  exportFileAsText(fileId: string): Observable<string> {
    return this.loadDriveApi().pipe(
      switchMap(() =>
        from(
          gapi.client.drive.files.export({
            fileId,
            mimeType: 'text/plain',
          }) as Observable<gapi.client.Response<string>>,
        ),
      ),
      take(1),
      map((response) => response.body),
    );
  }

  exportFileAsPdf(fileId: string): Observable<Blob> {
    return this.loadDriveApi().pipe(
      switchMap(() =>
        from(
          gapi.client.drive.files.export({
            fileId,
            mimeType: 'application/pdf',
          }) as Observable<gapi.client.Response<Blob>>,
        ),
      ),
      take(1),
      map((response) => {
        return this.binaryStringToBlob(response.body);
      }),
    );
  }

  binaryStringToBlob(
    binaryStr: string,
    mimeType: string = 'application/pdf',
  ): Blob {
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i) & 0xff;
    }

    return new Blob([bytes], { type: mimeType });
  }

  getFile(fileId: string, query = {}): Observable<gapi.client.drive.File> {
    return this.loadDriveApi().pipe(
      switchMap(
        () =>
          from(gapi.client.drive.files.get({ ...query, fileId })) as Observable<
            gapi.client.Response<gapi.client.drive.File>
          >,
      ),
      take(1),
      map((response: gapi.client.Response<gapi.client.drive.File>) =>
        JSON.parse(response.body),
      ),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  findFileByName(
    title: string,
    mimeType = 'application/vnd.google-apps.document',
  ): Observable<gapi.client.drive.File[]> {
    return this.loadDriveApi().pipe(
      switchMap(() =>
        from(
          gapi.client.drive.files.list({
            q: [
              `name = '${title.replace(/'/g, "\\'")}'`,
              `mimeType = '${mimeType}'`,
              'trashed = false',
            ].join(' and '),
            fields: 'files(id, name, mimeType, parents)',
            pageSize: 1,
          }),
        ),
      ),
      take(1),
      map((response: any) => response.result.files),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  findFolderIdByName(
    name: string,
    parentId: string = 'root',
  ): Observable<string | null> {
    return this.loadDriveApi().pipe(
      switchMap(
        () =>
          from(
            gapi.client.drive.files.list({
              q: [
                `name = '${name.replace(/'/g, "\\'")}'`,
                "mimeType = 'application/vnd.google-apps.folder'",
                'trashed = false',
                `'${parentId}' in parents`,
              ].join(' and '),
              fields: 'files(id)',
              pageSize: 1,
            }),
          ) as Observable<
            gapi.client.Response<{
              files: gapi.client.drive.File[];
            }>
          >,
      ),
      take(1),
      map((res) => res.result.files?.[0]?.id || null),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  createFolder(name: string, parentId: string = 'root'): Observable<string> {
    return this.loadDriveApi().pipe(
      switchMap(() =>
        from(
          gapi.client.drive.files.create({
            resource: {
              name,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [parentId],
            },
            fields: 'id',
          }) as Observable<gapi.client.Response<gapi.client.drive.File>>,
        ),
      ),
      take(1),
      map((res) => res.result.id ?? ''),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  getOrCreateFolder(
    name: string,
    parentId: string = 'root',
  ): Observable<string> {
    return this.findFolderIdByName(name, parentId).pipe(
      switchMap((folderId) => {
        if (folderId) {
          return of(folderId);
        } else {
          return this.createFolder(name, parentId);
        }
      }),
    );
  }

  createFolderPath(
    path: string | string[],
    rootId = 'root',
  ): Observable<string> {
    const parts: string[] = typeof path === 'string' ? path.split('/') : path;
    return parts.reduce(
      (parentId$, folderName) =>
        parentId$.pipe(
          switchMap((parentId) =>
            this.findFolderIdByName(folderName, parentId).pipe(
              switchMap((folderId) =>
                folderId
                  ? of(folderId)
                  : this.createFolder(folderName, parentId),
              ),
            ),
          ),
        ),
      of(rootId),
    );
  }

  moveFileTo(
    fileId: string,
    folderId: string = 'root',
  ): Observable<gapi.client.drive.File> {
    return this.loadDriveApi().pipe(
      switchMap((_) => {
        return from(
          gapi.client.drive.files.update({
            fileId,
            addParents: folderId,
            removeParents: 'root',
            fields: 'id, parents',
          }),
        ) as Observable<gapi.client.Response<gapi.client.drive.File>>;
      }),
      take(1),
      map(
        (response: gapi.client.Response<gapi.client.drive.File>) =>
          response.result,
      ),
    );
  }

  saveAsGoogleDoc(id: string): Observable<gapi.client.drive.File> {
    return forkJoin([
      this.exportFileAsBinary(id),
      this.getFile(id, {
        fields: 'id, name, mimeType, parents',
      }).pipe(filter((o) => !!o)),
    ]).pipe(
      switchMap(([file, fileMetadata]: [Blob, gapi.client.drive.File]) =>
        from(
          this.googleDocsService.uploadAndConvertDocxToGoogleDoc(
            file,
            fileMetadata.name || 'Untitled',
            fileMetadata.parents,
          ),
        ),
      ),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  uploadPdf(
    pdfFile: File | Blob,
    fileName: string,
    parentId: string = 'root',
  ): Observable<gapi.client.drive.File> {
    return this.loadDriveApi().pipe(
      switchMap(() => {
        const metadata = {
          name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
          parents: [parentId],
          mimeType: 'application/pdf',
        };

        const form = new FormData();
        form.append(
          'metadata',
          new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
        );
        form.append('file', pdfFile);

        const accessToken = gapi.auth.getToken().access_token;
        const headers = new HttpHeaders({
          Authorization: `Bearer ${accessToken}`,
        });

        return this.http.post<gapi.client.drive.File>(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          form,
          { headers },
        );
      }),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  saveGoogleDocAsPdf(
    docId: string,
    fileName: string,
    parentId: string = 'root',
  ): Observable<gapi.client.drive.File> {
    return this.exportFileAsPdf(docId).pipe(
      switchMap((pdfBlob: Blob) => {
        return this.uploadPdf(pdfBlob, fileName, parentId);
      }),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  public saveAsGoogleDocAndOpenSpinnerDialog(
    fileId: string,
  ): Observable<gapi.client.drive.File> {
    this.openDialog('500ms', '250ms');
    return this.saveAsGoogleDoc(fileId).pipe(
      tap((file: gapi.client.drive.File) =>
        this.snackService.openSnackBar(
          `${file.name} has been saved as a Google Doc.`,
        ),
      ),
      finalize(() => {
        this.dialog.closeAll();
      }),
    );
  }

  public openDialog(
    enterAnimationDuration: string = '0ms',
    exitAnimationDuration: string = '0ms',
  ): void {
    this.dialog.open(SpinnerDialog, {
      data: { title: 'Saving as Google Doc', message: 'Please wait...' },
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
      disableClose: true,
    });
  }

  getPdfFromDrive(
    fileId: string,
  ): Observable<{ file: gapi.client.drive.File; blob: Blob }> {
    return this.loadDriveApi().pipe(
      switchMap((_) => this.getFileInfo(fileId)),
      switchMap((fileInfo) => {
        let url: string;

        if (this.isGoogleWorkspaceDocument(fileInfo.mimeType)) {
          url = `${GoogleDriveService.API_BASE}/files/${fileId}/export?mimeType=application%2Fpdf`;
        } else if (fileInfo.mimeType === 'application/pdf') {
          url = `${GoogleDriveService.API_BASE}/files/${fileId}?alt=media`;
        } else {
          return throwError(() => new Error('File cannot be converted to PDF'));
        }

        const accessToken = gapi.auth.getToken().access_token;
        const headers = new HttpHeaders({
          Authorization: `Bearer ${accessToken}`,
        });

        return this.http
          .get(url, {
            headers,
            responseType: 'blob',
          })
          .pipe(switchMap((blob: Blob) => of({ file: fileInfo, blob })));
      }),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  private getFileInfo(fileId: string): Observable<gapi.client.drive.File> {
    return this.getFile(fileId, { fields: 'mimeType, name' });
  }

  private isGoogleWorkspaceDocument(mimeType: string | undefined): boolean {
    const workspaceMimeTypes = [
      'application/vnd.google-apps.document', // Google Docs
      'application/vnd.google-apps.spreadsheet', // Google Sheets
      'application/vnd.google-apps.presentation', // Google Slides
    ];
    return workspaceMimeTypes.includes(mimeType ?? '');
  }
}
