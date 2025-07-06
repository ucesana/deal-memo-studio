import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  forkJoin,
  Observable,
  of,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { GoogleDriveService } from '../../services/google-drive.service';

import { AppSettingsService } from '../../services/app-settings.service';
import { AsyncPipe } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GoogleAuthService } from '../../services/google-auth.service';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavModule,
} from '@angular/material/sidenav';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { GoogleDocsService } from '../../services/google-docs.service';
import { TagsComponent } from '../tags/tags.component';
import { map } from 'rxjs/operators';
import { MatToolbar } from '@angular/material/toolbar';
import {
  NgxExtendedPdfViewerModule,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';
import { MatTooltip } from '@angular/material/tooltip';
import { PdfViewer } from '../../common/components/pdf-viewer/pdf-viewer';
import { blobToBase64 } from '../../common/functions/base64';

@UntilDestroy()
@Component({
  selector: 'app-documents',
  imports: [
    AsyncPipe,
    MatSidenavModule,
    MatSidenavContainer,
    MatIcon,
    MatIconButton,
    MatButton,
    MatProgressSpinner,
    TagsComponent,
    MatToolbar,
    NgxExtendedPdfViewerModule,
    MatTooltip,
    PdfViewer,
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent implements OnInit, AfterViewInit {
  @Input() id: string = '';
  @Input() height: string = '100vh';
  @Input() width: string = '812px';

  @ViewChild('hightlightTagsDrawer') public hightlightTagsDrawer!: MatSidenav;
  @ViewChild('pdfViewer') public pdfViewer!: PdfViewer;

  private readonly _route = inject(ActivatedRoute);
  private readonly _googleAuthService = inject(GoogleAuthService);
  private readonly _googleDriveService = inject(GoogleDriveService);
  private readonly _googleDocsService = inject(GoogleDocsService);
  private readonly _lastVisited = inject(AppSettingsService);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly _docSubject = new BehaviorSubject<any>(null);
  private readonly _docLoadStateSubject: Subject<
    'loading' | 'error' | 'loaded'
  > = new BehaviorSubject<'loading' | 'error' | 'loaded'>('loading');

  public readonly isLoggedIn$: Observable<boolean>;
  public readonly doc$ = this._docSubject.asObservable();
  public readonly docLoadState$: Observable<'loading' | 'error' | 'loaded'> =
    this._docLoadStateSubject.asObservable();

  public isPanelOpen = false;
  public tags: string[] = [];
  public tagErrors: string[] = [];

  constructor() {
    this.isLoggedIn$ = this._googleAuthService.getIsLoggedIn();
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this._lastVisited.setLastEditorId(id);

      this.loadResource(this.id);
    }
  }

  public ngAfterViewInit(): void {
    // this.isLoggedIn$
    //   .pipe(untilDestroyed(this))
    //   .subscribe((isLoggedIn: boolean) => {
    //     if (isLoggedIn) {
    //       if (this.id?.length) {
    //         this.loadResource(this.id);
    //       }
    //     }
    //   });
  }

  private loadResource(id: string) {
    if (!id?.length) {
      return;
    }

    this._docLoadStateSubject.next('loading');

    forkJoin([
      this._googleDriveService
        .exportFileAsPdf(id)
        .pipe(switchMap((blob: Blob) => blobToBase64(blob))),
      this._googleDriveService.exportFileAsText(id),
      this._googleDocsService.getDocument(id),
    ])
      .pipe(
        map(([pdf, text, content]) => ({
          pdf,
          text,
          content,
        })),
        take(1),
        catchError((err) => {
          console.error('Failed to get document', err);
          this.tagErrors = [];
          this.tags = [];
          this._docLoadStateSubject.next('error');
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!!res) {
          this.tagErrors = this.validateDoubleAngleTokens(res.text);
          this.tags =
            this.tagErrors.length === 0
              ? this.extractDoubleAngleTags(res.text)
              : [];
          this._docSubject.next(res);
          this._docLoadStateSubject.next('loaded');
          this._cdr.markForCheck();
        }
      });
  }

  private downloadPDF(blob: Blob) {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'exported-doc.pdf';
    link.click();
  }

  toUint8Array(blob: Blob): Observable<Uint8Array> {
    return new Observable<Uint8Array>((observer) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          observer.next(new Uint8Array(reader.result));
          observer.complete();
        } else {
          observer.error(
            new Error('FileReader did not return an ArrayBuffer.'),
          );
        }
      };

      reader.onerror = (error) => {
        observer.error(error);
      };

      reader.readAsArrayBuffer(blob);

      return () => {
        reader.abort();
      };
    });
  }

  extractDoubleAngleTags(input: string): string[] {
    const regex = /<<([\s\S]*?)>>/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(input)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  }

  sanitizeTag(tag: string): string {
    let sanitized = tag.trim().replace(/\s+/g, ' ');
    sanitized = sanitized.replace(
      /\b\w+/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
    return sanitized;
  }

  validateDoubleAngleTokens(input: string): string[] {
    const errors: string[] = [];

    // Match all <<...>> tokens
    const regex = /<<([\s\S]*?)>>/g;
    let match;
    let matchIndices: number[] = [];
    let insideMatchIndex = 0;
    let unmatchedLeft = (input.match(/<</g) || []).length;
    let unmatchedRight = (input.match(/>>/g) || []).length;

    // Validate tokens
    while ((match = regex.exec(input)) !== null) {
      matchIndices.push(match.index);
      insideMatchIndex++;
      unmatchedLeft--;
      unmatchedRight--;
      const token = match[1];

      // 0. Check for empty tag
      if (token.trim().length === 0) {
        errors.push(`Tag cannot be empty: "<<>>" found.`);
        continue; // Skip further checks for empty tag
      }

      // 1. Check for allowed characters
      if (!/^[a-zA-Z0-9\s]+$/.test(token)) {
        errors.push(
          `Invalid characters in tag: "${token}". Only alphanumeric characters and whitespace allowed.`,
        );
      }

      // 2. Check for whitespace before or after the tag contents
      if (/^\s|\s$/.test(token)) {
        errors.push(
          `Extra whitespace before or after angle brackets: "<<${token}>>". Tags cannot start or end with whitespace.`,
        );
      }

      // 3. Check for disallowed whitespace (tabs, newlines, repeated spaces)
      if (/\t|\n|\r/.test(token)) {
        errors.push(
          `Invalid whitespace in tag: "<<${token}>>". Only single spaces allowed between words.`,
        );
      }
      if (/ {2,}/.test(token)) {
        errors.push(
          `Multiple consecutive spaces in token: "<<${token}>>". Only single spaces allowed between words.`,
        );
      }
    }

    // Check for unmatched brackets
    if (unmatchedLeft !== 0 || unmatchedRight !== 0) {
      errors.push(
        `Mismatched brackets: found ${unmatchedLeft + insideMatchIndex} opening << and ${
          unmatchedRight + insideMatchIndex
        } closing >>.`,
      );
    }

    return errors;
  }

  public pdfLoaded($event: PdfLoadedEvent) {
    if (this.hightlightTagsDrawer.opened) {
      this.highlightTags();
    }
  }

  public toggleHighlightTags(): void {
    this.hightlightTagsDrawer.toggle().then((_) => {
      if (this.hightlightTagsDrawer.opened) {
        this.highlightTags();
      } else {
        this.clearHighlights();
      }
    });
  }

  public clearHighlights() {
    if (this.pdfViewer) {
      this.pdfViewer.setSearchText('');
    }
  }

  public highlightTags() {
    if (this.tags && this.pdfViewer) {
      this.pdfViewer.setSearchText(this.tags.map((tag) => `<<${tag}>>`));
    }
  }

  public refresh(): void {
    this.loadResource(this.id);
  }
}
