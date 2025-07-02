import { inject, Injectable } from '@angular/core';
import { catchError, from, Observable, switchMap, tap, throwError } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { GoogleAuthService } from './google-auth.service';
import { DocumentTagData, TagData } from './tag.service';

export interface SimpleGoogleFile {
  id: string;
  url: string;
  title: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleDocsService {
  private static readonly DOCS_API_NAME = 'docs';
  private static readonly DOCS_API_VERSION = 'v1';

  private readonly googleAuthService: GoogleAuthService =
    inject(GoogleAuthService);

  private isDocsApiLoaded = false;
  private docsApiLoadedPromise: Promise<any> = new Promise((resolve) => {});

  public getDocument(documentId: string): Observable<// @ts-ignore
  gapi.client.docs.Document> {
    return this.loadDocsApi().pipe(
      switchMap(
        () =>
          from(
            // @ts-ignore
            gapi.client.docs.documents.get({ documentId }),
            // @ts-ignore
          ) as Observable<gapi.client.Response<gapi.client.docs.Document>>,
      ),
      take(1),
      map(
        // @ts-ignore
        (response: gapi.client.Response<gapi.client.docs.Document>) => {
          try {
            return JSON.parse(response.body);
          } catch (error) {
            console.error('Error parsing Google Doc JSON:', error);
            throw error;
          }
        },
      ),
      catchError((response) => {
        return this.googleAuthService.handleError(response);
      }),
    );
  }

  async uploadAndConvertDocxToGoogleDoc(
    file: Blob,
    fileName: string,
    parentIds: string[] = [],
  ): Promise<gapi.client.drive.File> {
    const accessToken = gapi.auth.getToken().access_token;

    const metadata = {
      name: fileName.replace(/\.docx$/, ''), // Remove .docx for Google Doc
      mimeType: 'application/vnd.google-apps.document', // Target Google Docs
    };

    if (parentIds.length) {
      const parentId = parentIds[0];
      // @ts-ignore
      metadata['parents'] = [parentId];
    }

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    form.append('file', file, metadata.name);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
        body: form,
      },
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private loadDocsApi(): Observable<any> {
    if (!this.googleAuthService.isAuthenticated()) {
      console.warn('token not found');
      return throwError(() => new Error('Not signed in to Google API client.'));
    }

    if (!this.isDocsApiLoaded) {
      this.docsApiLoadedPromise = gapi.client.load(
        GoogleDocsService.DOCS_API_NAME,
        GoogleDocsService.DOCS_API_VERSION,
      );
      this.isDocsApiLoaded = true;
    }
    return from(
      this.docsApiLoadedPromise.then((result) => {
        return result;
      }),
    );
  }

  applyTags(
    documentId: string,
    parentId: string,
    tagData: TagData,
    title: string,
  ): Observable<SimpleGoogleFile> {
    return from(
      gapi.client.drive.files.copy({
        fileId: documentId,
        resource: {
          name: title,
          mimeType: 'application/vnd.google-apps.document',
          parents: parentId ? [parentId] : undefined,
        },
      }),
    ).pipe(
      switchMap((copyRes: gapi.client.Response<gapi.client.drive.File>) => {
        const id = copyRes.result.id;
        const requests = tagData.map(([tagName, tagValue]) => ({
          replaceAllText: {
            containsText: {
              text: `<<${tagName}>>`,
              matchCase: false,
            },
            replaceText: tagValue,
          },
        }));

        return from(
          // @ts-ignore
          gapi.client.docs.documents.batchUpdate({
            documentId: id,
            requests,
          }),
        ).pipe(
          map(
            () =>
              ({
                id,
                url: `https://docs.google.com/document/d/${id}/edit`,
                title: title || 'Document (Modified)',
              }) as SimpleGoogleFile,
          ),
        );
      }),
    );
  }

  batchReplaceTagsAndCreateDocs(
    documentId: string,
    parentId: string,
    documentTagData: DocumentTagData,
    titleFn: (tagData: TagData, idx: number) => string,
  ): Observable<(SimpleGoogleFile | undefined)[]> {
    const allPromises = documentTagData.map((tagData, idx) => {
      const title = titleFn ? titleFn(tagData, idx) : `Document ${idx + 1}`;
      return this.applyTags(documentId, parentId, tagData, title).toPromise();
    });

    return from(Promise.all(allPromises));
  }
}
