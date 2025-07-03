import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatStep,
  MatStepper,
  MatStepperModule,
  MatStepperPrevious,
} from '@angular/material/stepper';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { DriveSelectorComponent } from '../drive-selector/drive-selector.component';
import { TagSelectorComponent } from '../tag-selector/tag-selector.component';
import { DocumentTagData, getArtistName } from '../../services/tag.service';
import { SheetTableItemSelection } from '../spreadsheet-table/spreadsheet-table.component';
import { DocumentsComponent } from '../documents/documents.component';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  GoogleDocsService,
  SimpleGoogleFile,
} from '../../services/google-docs.service';
import {
  AppFileStructure,
  DealMemoService,
} from '../../services/deal-memo.service';
import { filter, map, take } from 'rxjs/operators';
import {
  DriveSearchQuery,
  GoogleDriveService,
} from '../../services/google-drive.service';
import { BehaviorSubject, Observable, Subject, switchMap, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';
import {
  processRequestsWatchProgress,
  RequestResult,
  RequestTask,
} from '../../common/functions/request-util';
import {
  Progress,
  ProgressWatcher,
} from '../../common/classes/progress-watcher';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCheckbox } from '@angular/material/checkbox';
import { DriveList } from '../drive-list/drive-list';
import { SnackService } from '../../common/services/snack.service';
import { DealMemoCreatorStateService } from './services/deal-memo-creator-state-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ContextMenuItem } from '../../common/components/context-menu/context-menu';
import { DriveContextMenuService } from '../../services/drive-context-menu.service';

@Component({
  selector: 'app-deal-memo-creator',
  imports: [
    MatStepper,
    MatStep,
    MatButton,
    MatStepperPrevious,
    DriveSelectorComponent,
    TagSelectorComponent,
    DocumentsComponent,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AsyncPipe,
    MatProgressBar,
    MatProgressSpinner,
    MatCheckbox,
    DriveList,
  ],
  templateUrl: './deal-memo-creator.component.html',
  styleUrl: './deal-memo-creator.component.scss',
})
export class DealMemoCreator implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('stepper') public stepper!: MatStepper;
  @ViewChild('tagSelector') public tagSelector!: TagSelectorComponent;
  @ViewChild('dealMemoNameInput')
  public dealMemoNameInput!: ElementRef<HTMLInputElement>;

  private readonly _formBuilder = inject(FormBuilder);
  private readonly _googleDocsService = inject(GoogleDocsService);
  private readonly _dealMemoService = inject(DealMemoService);
  private readonly _googleDriveService = inject(GoogleDriveService);
  private readonly _snackService = inject(SnackService);
  private readonly _stateService = inject(DealMemoCreatorStateService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _driveContextMenuService = inject(DriveContextMenuService);

  private readonly _dealMemosProgressWatcher = new ProgressWatcher<
    RequestResult<SimpleGoogleFile>
  >();
  private readonly _selectedSpreadsheetIdSubject: Subject<string | null> =
    new BehaviorSubject<string | null>(null);

  public readonly templateSearchQuery: DriveSearchQuery = {
    mimeTypes: [
      'application/vnd.google-apps.folder',
      'application/vnd.google-apps.document',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  };

  public readonly spreadsheetSearchQuery: DriveSearchQuery = {
    mimeTypes: [
      'application/vnd.google-apps.folder',
      'application/vnd.google-apps.spreadsheet',
    ],
  };

  public progress$: Observable<Progress<RequestResult<SimpleGoogleFile>>> =
    this._dealMemosProgressWatcher.getProgress$();

  public reviewFormGroup = this._formBuilder.group({
    name: ['', Validators.required],
    pdf: [false],
  });
  public selectedTemplate: gapi.client.drive.File | null = null;
  public selectedTagData: DocumentTagData | null = null;
  public destinationFolder: { name: string; id: string }[] = [];
  public dealMemosTotal: number = 0;
  public dealMemos: SimpleGoogleFile[] = [];
  public dealMemoPdfs: SimpleGoogleFile[] = [];
  public isCreating: boolean = false;
  public driveListContextMenuItems: ContextMenuItem[] = [];
  public selectedSpreadsheetId: string | null = null;

  constructor() {
    this.progress$
      .pipe(filter((progress) => progress.status === 'done'))
      .subscribe((_) => {
        this._snackService.openSnackBar(
          `Finished creating ${this.dealMemosTotal} deal memos.`,
          'View',
          () => {
            this.stepper.selectedIndex = 3;
          },
        );
      });

    this.driveListContextMenuItems = [
      this._driveContextMenuService.openFile(),
      this._driveContextMenuService.openInGoogleDrive(),
      this._driveContextMenuService.saveAsGoogleDoc((file) =>
        this._router.navigate(['/dashboard/docs', file.id]),
      ),
    ];

    this._dealMemoService
      .getAppFileStructure()
      .subscribe((appFileStructure) => {
        this._selectedSpreadsheetIdSubject.next(
          appFileStructure.userDataFile.id,
        );
      });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    if (this._route.snapshot.params['action'] === 'new') {
      this.initState();
    } else if (this._route.snapshot.data['reuseRoute']) {
      this._stateService.getState().subscribe((state) => {
        if (state) {
          this.restoreComponentState(state);
        }
      });
    }
  }

  public ngOnDestroy() {
    // Do not need to destroy because I am reusing the component
    // if (this._dealMemosProgressWatcher) {
    //   this._dealMemosProgressWatcher.destroy();
    // }
    const reuseRoute = this._route.snapshot.data['reuseRoute'];
    if (reuseRoute) {
      this.storeState();
    }
  }

  public initState(): void {
    this._dealMemosProgressWatcher.reset();
    this.stepper.reset();
    this.selectedTemplate = null;
    this.selectedTagData = null;
    this.selectedSpreadsheetId = null;
    this.reviewFormGroup.reset();
    this.isCreating = false;
    this.destinationFolder = [];
    this.dealMemosTotal = 0;
    this.dealMemos = [];
    this.dealMemoPdfs = [];
  }

  public cancel(): void {
    this.initState();
  }

  public storeState(): void {
    const currentState = {
      selectedTemplate: this.selectedTemplate,
      selectedTagData: this.selectedTagData,
      selectedSpreadsheetId: this.selectedSpreadsheetId,
      reviewFormGroup: this.reviewFormGroup.value,
      isCreating: this.isCreating,
      destinationFolder: this.destinationFolder,
      dealMemosTotal: this.dealMemosTotal,
      dealMemos: this.dealMemos,
      dealMemoPdfs: this.dealMemoPdfs,
      selectedIndex: this.stepper.selectedIndex,
    };
    this._stateService.setState(currentState);
  }

  private restoreComponentState(state: any): void {
    this.stepper.reset();
    this.selectedTemplate = state.selectedTemplate;
    this.selectedTagData = state.selectedTagData;
    this.selectedSpreadsheetId = state.selectedSpreadsheetId;
    this.reviewFormGroup.patchValue(state.reviewFormGroup);
    this.isCreating = state.isCreating;
    this.destinationFolder = state.destinationFolder;
    this.dealMemosTotal = state.dealMemosTotal;
    this.dealMemoPdfs = state.dealMemoPdfs;
    this.dealMemos = state.dealMemos;
    this.stepper.selectedIndex = state.selectedIndex;
  }

  public selectTemplate(file: gapi.client.drive.File): void {
    this.selectedTemplate = file;
    this.selectedTagData = null;
  }

  public next(): void {
    this.stepper.next();
  }

  public create(): void {
    if (this.reviewFormGroup.invalid) {
      this.dealMemoNameInput.nativeElement.focus();
    } else {
      const dealMemosFolderName = this.appendDateTimeToFilename(
        this.reviewFormGroup.get('name')?.getRawValue(),
      );
      const includePdf = this.reviewFormGroup.get('pdf')?.value;

      this.dealMemos = [];
      this.isCreating = true;

      let app: AppFileStructure;
      let destinationFolder: { name: string; id: string }[] = [];

      this._dealMemoService
        .getAppFileStructure()
        .pipe(
          take(1),
          tap((appFileStructure) => (app = appFileStructure)),
          switchMap((appFileStructure) =>
            this._googleDriveService.createFolder(
              dealMemosFolderName,
              appFileStructure.dealMemosFolder.id,
            ),
          ),
          tap((dealMemoFolderId) => {
            destinationFolder = [
              app.rootFolder,
              app.dealMemosFolder,
              { name: dealMemosFolderName, id: dealMemoFolderId },
            ].map(({ id, name }) => ({ id, name }));
          }),
        )
        .subscribe((folderId) => {
          if (!!this.selectedTemplate?.id && this.selectedTagData) {
            const documentId = this.selectedTemplate.id;
            const requests: RequestTask<SimpleGoogleFile>[] =
              this.selectedTagData.map((tagData, idx) => {
                const title = getArtistName(tagData, idx);
                return {
                  id: String(idx),
                  title,
                  request$: this._googleDocsService.applyTags(
                    documentId,
                    folderId,
                    tagData,
                    title,
                  ),
                };
              });

            this.dealMemosTotal = requests.length;

            this._dealMemosProgressWatcher.pending(
              requests.length * (includePdf ? 2 : 1),
            );

            processRequestsWatchProgress(
              requests,
              this._dealMemosProgressWatcher,
            )
              .pipe(
                map((responses: RequestResult<SimpleGoogleFile>[]) => {
                  return responses
                    .filter((d) => d.success)
                    .map((d) => d.result)
                    .filter((d) => !!d);
                }),
                tap((dealMemos) => (this.dealMemos = dealMemos)),
              )
              .subscribe((responses: SimpleGoogleFile[]) => {
                if (includePdf) {
                  const requests = responses.map(({ id, title }, idx) => {
                    return {
                      id: String(idx),
                      title,
                      request$: this._googleDriveService
                        .saveGoogleDocAsPdf(
                          id,
                          title,
                          destinationFolder[destinationFolder.length - 1].id,
                        )
                        .pipe(
                          map(({ id, name: title }: gapi.client.drive.File) => {
                            return {
                              id,
                              title,
                              url: `https://drive.google.com/file/d/${id}/view`,
                            } as SimpleGoogleFile;
                          }),
                        ),
                    };
                  });

                  processRequestsWatchProgress(
                    requests,
                    this._dealMemosProgressWatcher,
                  ).subscribe(
                    (responses: RequestResult<SimpleGoogleFile>[]) => {
                      this.dealMemoPdfs = responses
                        .filter((d) => d.success)
                        .map((d) => d.result)
                        .filter((d) => !!d);
                      this._dealMemosProgressWatcher.done();
                      this.isCreating = false;
                      this.destinationFolder = destinationFolder;
                    },
                  );
                } else {
                  this._dealMemosProgressWatcher.done();
                  this.isCreating = false;
                  this.destinationFolder = destinationFolder;
                }
              });
          }
        });
    }
  }

  public selectTagData(tagData: DocumentTagData): void {
    this.selectedTagData = tagData;
  }

  public selectSheets(sheetSelection: SheetTableItemSelection): void {}

  private appendDateTimeToFilename(filename: string): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const date = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
    ].join('-');

    const time = [
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join('-');

    const [name, ...extParts] = filename.split('.');
    const ext = extParts.length ? '.' + extParts.join('.') : '';

    return `${name}_${date}_${time}${ext}`;
  }

  selectedSpreadsheet(file: gapi.client.drive.File): void {
    this.selectedSpreadsheetId = file.id ?? '';
  }
}
