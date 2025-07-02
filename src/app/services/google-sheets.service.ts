import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  from,
  Observable,
  of,
  Subject,
  switchMap,
  throwError,
  take,
} from 'rxjs';
import { GoogleAuthService } from './google-auth.service';
import { Sheet, Spreadsheet } from '../models/spreadsheet';
import { map } from 'rxjs/operators';

declare const gapi: any;

@Injectable({
  providedIn: 'root',
})
export class GoogleSheetsService {
  private static readonly API_NAME = 'sheets';
  private static readonly API_VERSION = 'v4';

  private readonly googleAuthService: GoogleAuthService =
    inject(GoogleAuthService);

  private isDriveApiLoaded = false;
  private driveApiLoadedPromise: Promise<any> = new Promise((resolve) => {});

  constructor() {}

  loadSheetsApi(): Observable<any> {
    if (!this.googleAuthService.isAuthenticated()) {
      console.warn('Token not found');
      return throwError(() => new Error('Not signed in to Google API client.'));
    }

    if (!this.isDriveApiLoaded) {
      this.driveApiLoadedPromise = gapi.client.load(
        GoogleSheetsService.API_NAME,
        GoogleSheetsService.API_VERSION,
      );
      this.isDriveApiLoaded = true;
    }
    return from(
      this.driveApiLoadedPromise.then((result) => {
        return result;
      }),
    ).pipe(take(1));
  }

  getSpreadsheet(
    spreadsheetId: string,
  ): Observable<gapi.client.sheets.Spreadsheet> {
    return new Observable((observer) => {
      this.loadSheetsApi().subscribe({
        next: () => {
          gapi.client.sheets.spreadsheets
            .get({
              spreadsheetId,
              includeGridData: true,
            })
            .then((response: any) => {
              observer.next(response.result);
              observer.complete();
            })
            .catch((error: any) => {
              observer.error(error);
            });
        },
        error: (apiError) => {
          observer.error(apiError);
        },
      });
    });
  }

  createSpreadsheet(
    spreadsheet: Spreadsheet,
  ): Observable<gapi.client.sheets.Spreadsheet> {
    return this.loadSheetsApi().pipe(
      switchMap(
        () =>
          from(
            gapi.client.sheets.spreadsheets.create(
              this.toSpreadsheetPayload(spreadsheet),
            ),
          ) as Observable<gapi.client.Response<gapi.client.sheets.Spreadsheet>>,
      ),
      take(1),
      map(
        (response: gapi.client.Response<gapi.client.sheets.Spreadsheet>) =>
          response.result,
      ),
    );
  }

  private toSpreadsheetPayload(
    spreadsheet: Spreadsheet,
  ): gapi.client.sheets.Spreadsheet {
    return {
      properties: {
        title: spreadsheet?.title?.length ? spreadsheet.title : 'Untitled',
      },
      sheets: spreadsheet?.sheets?.length
        ? spreadsheet.sheets.map((sheet) => this.toSheetData(sheet))
        : [],
    };
  }

  private toSheetData(sheet: Sheet) {
    return {
      properties: { title: sheet.title },
      data: [
        {
          rowData: sheet.data?.length
            ? sheet.data.map((row) => this.toRowDatum(row))
            : [],
        },
      ],
    };
  }

  private toRowDatum(row: string[]) {
    return {
      values: row?.length
        ? row.map((cell) => {
            return { userEnteredValue: { stringValue: cell } };
          })
        : [],
    };
  }
}
