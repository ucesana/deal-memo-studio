import { inject, Injectable } from '@angular/core';
import { GoogleDriveService } from './google-drive.service';
import {
  BehaviorSubject,
  catchError,
  finalize,
  forkJoin,
  from,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { GoogleSheetsService } from './google-sheets.service';
import { Spreadsheet } from '../models/spreadsheet';
import { filter, map, take } from 'rxjs/operators';
import { ProgressWatcher } from '../common/classes/progress-watcher';
import { GoogleAuthService } from './google-auth.service';

export interface AppFile {
  id: string;
  name: string;
  path: string[];
}

export interface AppFileStructure {
  rootFolder: AppFile;
  templateFolder: AppFile;
  dealMemosFolder: AppFile;
  dataFolder: AppFile;
  appDataFile: AppFile;
  userDataFile: AppFile;
}

@Injectable({
  providedIn: 'root',
})
export class DealMemoService {
  public static APP_ROOT_FOLDER_NAME = 'Deal Memo App';
  public static TEMPLATES_FOLDER_NAME = 'Templates';
  public static DEAL_MEMOS_FOLDER_NAME = 'Deal Memos';
  public static DATA_FOLDER_NAME = 'Data';
  public static readonly APP_ROOT_FOLDER_PATH = [
    DealMemoService.APP_ROOT_FOLDER_NAME,
  ];
  public static readonly TEMPLATE_FOLDER_PATH = [
    ...DealMemoService.APP_ROOT_FOLDER_PATH,
    DealMemoService.TEMPLATES_FOLDER_NAME,
  ];
  public static readonly DEAL_MEMOS_FOLDER_PATH = [
    ...DealMemoService.APP_ROOT_FOLDER_PATH,
    DealMemoService.DEAL_MEMOS_FOLDER_NAME,
  ];
  public static readonly DATA_FOLDER = [
    ...DealMemoService.APP_ROOT_FOLDER_PATH,
    DealMemoService.DATA_FOLDER_NAME,
  ];
  public static readonly USER_DATA_NAME = 'User Data';
  public static readonly APP_DATA_NAME = 'App Data';

  private readonly appLoadProgressStepper: ProgressWatcher<unknown> =
    new ProgressWatcher(9);

  private readonly googleDriveService = inject(GoogleDriveService);
  private readonly googleSheetsService = inject(GoogleSheetsService);
  private readonly googleAuthService = inject(GoogleAuthService);

  private readonly appFileStructureSubject: Subject<AppFileStructure | null> =
    new BehaviorSubject<AppFileStructure | null>(null);

  private userDataSpreadsheetSubject: Subject<gapi.client.sheets.Spreadsheet | null> =
    new BehaviorSubject<gapi.client.sheets.Spreadsheet | null>(null);

  private appDataSpreadsheetSubject: Subject<gapi.client.sheets.Spreadsheet | null> =
    new BehaviorSubject<gapi.client.sheets.Spreadsheet | null>(null);

  private appFileStructure$: Observable<AppFileStructure | null>;

  constructor() {
    this.appFileStructure$ = this.appFileStructureSubject.asObservable();
  }

  public loadOrCreateAppData() {
    this.createAppFileStructure();
  }

  private createAppFileStructure(): void {
    let fileStructure: Partial<AppFileStructure> = {};

    this.appLoadProgressStepper.pending();

    this.googleDriveService
      .getOrCreateFolder(DealMemoService.APP_ROOT_FOLDER_NAME)
      .pipe(
        tap((_) => this.appLoadProgressStepper.success()),
        tap(
          (id) =>
            (fileStructure.rootFolder = {
              id,
              name: DealMemoService.APP_ROOT_FOLDER_NAME,
              path: DealMemoService.APP_ROOT_FOLDER_PATH,
            }),
        ),
        switchMap((id: string) =>
          forkJoin([
            this.googleDriveService
              .getOrCreateFolder(DealMemoService.TEMPLATES_FOLDER_NAME, id)
              .pipe(tap((_) => this.appLoadProgressStepper.success())),
            this.googleDriveService
              .getOrCreateFolder(DealMemoService.DEAL_MEMOS_FOLDER_NAME, id)
              .pipe(tap((_) => this.appLoadProgressStepper.success())),
            this.googleDriveService
              .getOrCreateFolder(DealMemoService.DATA_FOLDER_NAME, id)
              .pipe(tap((_) => this.appLoadProgressStepper.success())),
          ]),
        ),
        tap(([templateFolderId, dealMemosFolderId, dataFolderId]) => {
          fileStructure = {
            ...fileStructure,
            templateFolder: {
              id: templateFolderId,
              name: DealMemoService.TEMPLATES_FOLDER_NAME,
              path: DealMemoService.TEMPLATE_FOLDER_PATH,
            },
            dealMemosFolder: {
              id: dealMemosFolderId,
              name: DealMemoService.DEAL_MEMOS_FOLDER_NAME,
              path: DealMemoService.DEAL_MEMOS_FOLDER_PATH,
            },
            dataFolder: {
              id: dataFolderId,
              name: DealMemoService.DATA_FOLDER_NAME,
              path: DealMemoService.DATA_FOLDER,
            },
          };
        }),
        switchMap((_) =>
          forkJoin([
            this.getOrCreateSpreadsheet(DealMemoService.APP_DATA_NAME, () =>
              this.createDefaultAppData(),
            ).pipe(
              tap((_) => this.appLoadProgressStepper.success()),
              tap((spreadsheet) =>
                this.appDataSpreadsheetSubject.next(spreadsheet),
              ),
              map((spreadsheet) => spreadsheet.spreadsheetId ?? ''),
            ),
            this.getOrCreateSpreadsheet(DealMemoService.USER_DATA_NAME, () =>
              this.createDefaultUserData(),
            ).pipe(
              tap((_) => this.appLoadProgressStepper.success()),
              tap((spreadsheet) =>
                this.userDataSpreadsheetSubject.next(spreadsheet),
              ),
              map((spreadsheet) => spreadsheet.spreadsheetId ?? ''),
            ),
          ]),
        ),
        tap(([appDataFileId, userDataFileId]) => {
          fileStructure = {
            ...fileStructure,
            appDataFile: {
              id: appDataFileId,
              name: DealMemoService.APP_DATA_NAME,
              path: [
                ...DealMemoService.DATA_FOLDER,
                DealMemoService.APP_DATA_NAME,
              ],
            },
            userDataFile: {
              id: userDataFileId,
              name: DealMemoService.USER_DATA_NAME,
              path: [
                ...DealMemoService.DATA_FOLDER,
                DealMemoService.USER_DATA_NAME,
              ],
            },
          };
        }),
        tap((_) =>
          this.appFileStructureSubject.next(fileStructure as AppFileStructure),
        ),
        switchMap(([appDataFileId, userDataFileId]) => {
          return forkJoin([
            this.googleDriveService
              .moveFileTo(appDataFileId, fileStructure.dataFolder?.id)
              .pipe(tap((_) => this.appLoadProgressStepper.success())),
            this.googleDriveService
              .moveFileTo(userDataFileId, fileStructure.dataFolder?.id)
              .pipe(tap((_) => this.appLoadProgressStepper.success())),
          ]);
        }),
        catchError((response) => {
          return this.googleAuthService.handleError(response);
        }),
        finalize(() => this.appLoadProgressStepper.done()),
      )
      .subscribe((_) => {});
  }

  private getOrCreateSpreadsheet(
    fileName: string,
    spreadsheetCreator: () => Spreadsheet,
  ): Observable<gapi.client.sheets.Spreadsheet> {
    return this.googleDriveService
      .findFileByName(fileName, 'application/vnd.google-apps.spreadsheet')
      .pipe(
        switchMap((files: gapi.client.drive.File[]) =>
          files?.length && files[0].id
            ? this.googleSheetsService.getSpreadsheet(files[0].id)
            : this.googleSheetsService.createSpreadsheet(spreadsheetCreator()),
        ),
      );
  }

  private createDefaultAppData(): Spreadsheet {
    return {
      title: DealMemoService.APP_DATA_NAME,
      sheets: [
        {
          title: 'Deal Memos',
          data: [],
        },
      ],
    };
  }

  private createDefaultUserData(): Spreadsheet {
    return {
      title: DealMemoService.USER_DATA_NAME,
      sheets: [
        {
          title: 'Project',
          data: [['Name', 'Film Name']],
        },
        {
          title: 'Production Company',
          data: [['Name', 'Address', 'Telephone', 'Email']],
        },
        {
          title: 'Artist',
          data: [['Name', 'Role', 'Address', 'Mobile', 'Email']],
        },
        {
          title: 'Agency',
          data: [['Name', 'Address', 'Telephone', 'Email']],
        },
        {
          title: 'Agent',
          data: [['Name', 'Agency Name']],
        },
      ],
    };
  }

  getAppLoadProgress(): Observable<number> {
    return this.appLoadProgressStepper
      .getProgress$()
      .pipe(map((o) => o.progress));
  }

  getAppDataSpreadsheet(): Observable<gapi.client.sheets.Spreadsheet | null> {
    return this.appDataSpreadsheetSubject.asObservable();
  }

  getUserDataSpreadsheet(): Observable<gapi.client.sheets.Spreadsheet | null> {
    return this.userDataSpreadsheetSubject.asObservable();
  }

  loadUserData(): void {
    this.appFileStructure$
      .pipe(
        filter((o) => !!o),
        switchMap((fileStructure) =>
          this.googleSheetsService.getSpreadsheet(
            fileStructure.userDataFile.id,
          ),
        ),
        filter((o) => !!o),
        take(1),
      )
      .subscribe((spreadsheet) => {
        this.userDataSpreadsheetSubject.next(spreadsheet);
      });
  }

  public getAppFileStructure(): Observable<AppFileStructure> {
    return this.appFileStructureSubject.asObservable().pipe(filter((o) => !!o));
  }
}
