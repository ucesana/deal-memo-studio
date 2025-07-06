import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { GoogleAuthService } from '../../services/google-auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ActivatedRoute } from '@angular/router';
import { AppSettingsService } from '../../services/app-settings.service';
import { map } from 'rxjs/operators';
import { GoogleDriveService } from '../../services/google-drive.service';
import { blobToBase64 } from '../../common/functions/base64';
import { PdfViewer } from '../../common/components/pdf-viewer/pdf-viewer';
import { PdfLoadedEvent } from 'ngx-extended-pdf-viewer';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@UntilDestroy()
@Component({
  selector: 'app-pdfs',
  imports: [
    AsyncPipe,
    MatToolbar,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatProgressSpinner,
    PdfViewer,
  ],
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.scss',
})
export class PdfComponent implements OnInit, AfterViewInit {
  @Input() height: string = '100vh';
  @Input() width: string = '812px';

  private readonly _googleAuthService = inject(GoogleAuthService);
  private readonly _googleDriveService = inject(GoogleDriveService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _lastVisited = inject(AppSettingsService);
  private readonly _cdr = inject(ChangeDetectorRef);

  private readonly _docSubject = new BehaviorSubject<{
    pdf: string;
    content: gapi.client.drive.File;
  } | null>(null);
  private readonly _docLoadStateSubject: Subject<
    'loading' | 'error' | 'loaded'
  > = new BehaviorSubject<'loading' | 'error' | 'loaded'>('loading');

  public readonly isLoggedIn$: Observable<boolean>;
  public readonly doc$ = this._docSubject.asObservable();
  public readonly docLoadState$: Observable<'loading' | 'error' | 'loaded'> =
    this._docLoadStateSubject.asObservable();

  id: string | null = null;

  constructor() {
    this.isLoggedIn$ = this._googleAuthService.getIsLoggedIn();
  }

  public ngOnInit(): void {
    this.id = this._route.snapshot.paramMap.get('id');
    if (this.id) {
      this._lastVisited.setLastPdfId(this.id);
    }
  }

  public ngAfterViewInit(): void {
    this.isLoggedIn$
      .pipe(untilDestroyed(this))
      .subscribe((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          if (this.id?.length) {
            this.loadResource(this.id);
          }
        }
      });
  }

  private loadResource(id: string | null = null) {
    if (!id?.length) {
      return;
    }

    this._docLoadStateSubject.next('loading');

    this._googleDriveService
      .getPdfFromDrive(id)
      .pipe(
        switchMap(({ file, blob }) =>
          blobToBase64(blob).pipe(
            switchMap((pdf) => of({ pdf, content: file })),
          ),
        ),
        catchError((err) => {
          console.error('Failed to get document', err);
          this._docLoadStateSubject.next('error');
          return of(null);
        }),
      )
      .subscribe(
        (res: { pdf: string; content: gapi.client.drive.File } | null) => {
          if (!!res) {
            this._docSubject.next(res);
            this._docLoadStateSubject.next('loaded');
            this._cdr.markForCheck();
          }
        },
      );
  }

  public refresh(): void {
    this.loadResource(this.id);
  }

  public pdfLoaded($event: PdfLoadedEvent) {}
}
