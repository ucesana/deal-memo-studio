import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  FindResultMatchesCount,
  FindState,
  NgxExtendedPdfViewerModule,
  NgxExtendedPdfViewerService,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-pdf-viewer',
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.scss',
})
export class PdfViewer {
  @Input() public base64Src: string | null = null;
  @Input() public src: string | null = null;
  @Input() public height: string = '100vh';
  @Input() public width: string = '812px';
  @Input() public backgroundColor: string = 'white';
  @Output() public pdfLoaded: EventEmitter<PdfLoadedEvent> = new EventEmitter();

  private readonly _ngxExtendedPdfViewerService = inject(
    NgxExtendedPdfViewerService,
  );

  private _findState: FindState | undefined;
  private _searchText: string | string[] = '';

  public highlightAll = true;
  public matchCase = true;
  public wholeWord = true;
  public matchDiacritics = true;
  public findMultiple = true;
  public regexp = undefined;
  public dontScrollIntoView = true;
  public currentMatchNumber: number | undefined;
  public totalMatches: number | undefined;
  public pagesWithResult: any[] = [];

  public getSearchText(): string | string[] {
    return this._searchText;
  }

  public setSearchText(text: string | string[]) {
    this._searchText = text;
    this.find();
  }

  public onCheckboxClicked() {
    this._ngxExtendedPdfViewerService.find(this._searchText, {
      highlightAll: this.highlightAll,
      matchCase: this.matchCase,
      wholeWords: this.wholeWord,
      matchDiacritics: this.matchDiacritics,
      dontScrollIntoView: this.dontScrollIntoView,
      useSecondaryFindcontroller: false,
      findMultiple: this.findMultiple,
      regexp: this.regexp,
    });
  }

  public findNext(): void {
    this._ngxExtendedPdfViewerService.findNext();
  }

  public findPrevious(): void {
    this._ngxExtendedPdfViewerService.findPrevious();
  }

  public updateFindState(result: FindState) {
    this._findState = result;
  }

  public updateFindMatchesCount(result: FindResultMatchesCount) {
    this.currentMatchNumber = result.current;
    this.totalMatches = result.total;
  }

  public onPdfLoaded($event: PdfLoadedEvent) {
    this.pdfLoaded.emit($event);
  }

  private find(): Array<Promise<number>> | undefined {
    this.pagesWithResult = [];
    if (!this._searchText) {
      this._findState = undefined;
      this.currentMatchNumber = undefined;
      this.totalMatches = undefined;
    }
    let searchText = this._searchText;
    const numberOfResultsPromises = this._ngxExtendedPdfViewerService.find(
      searchText,
      {
        highlightAll: this.highlightAll,
        matchCase: this.matchCase,
        wholeWords: this.wholeWord,
        matchDiacritics: this.matchDiacritics,
        dontScrollIntoView: this.dontScrollIntoView,
        useSecondaryFindcontroller: false,
        findMultiple: this.findMultiple,
        regexp: this.regexp,
      },
    );
    numberOfResultsPromises?.forEach(
      async (numberOfResultsPromise, pageIndex) => {
        const numberOfResultsPerPage = await numberOfResultsPromise;
        if (numberOfResultsPerPage > 0) {
          this.pagesWithResult.push(pageIndex);
        }
      },
    );
    return numberOfResultsPromises;
  }
}
