import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  SheetTableItemSelection,
  SpreadsheetTableComponent,
} from '../spreadsheet-table/spreadsheet-table.component';
import { AsyncPipe } from '@angular/common';
import { DocumentTagData } from '../../services/tag.service';
import { BehaviorSubject, filter, Observable, Subject } from 'rxjs';
import { DealMemoService } from '../../services/deal-memo.service';
import { map } from 'rxjs/operators';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { Spreadsheet } from '../../models/spreadsheet';

@Component({
  selector: 'app-tag-selector',
  imports: [SpreadsheetTableComponent, AsyncPipe],
  templateUrl: './tag-selector.component.html',
  styleUrl: './tag-selector.component.scss',
})
export class TagSelectorComponent implements OnInit {
  @Input() fileId = '';
  @Output() sheetSelection: EventEmitter<SheetTableItemSelection> =
    new EventEmitter();
  @Output() tagData: EventEmitter<DocumentTagData> = new EventEmitter();

  @ViewChild('spreadsheetTable') spreadsheetTable?: SpreadsheetTableComponent;

  public fileSubject: Subject<gapi.client.sheets.Spreadsheet | null> =
    new BehaviorSubject<gapi.client.sheets.Spreadsheet | null>(null);
  public file$: Observable<gapi.client.sheets.Spreadsheet | null> =
    this.fileSubject.asObservable();

  private readonly _googleSheetsService = inject(GoogleSheetsService);
  private readonly _dealMemoService: DealMemoService = inject(DealMemoService);

  ngOnInit(): void {
    this.load(this.fileId);
  }

  private load(fileId: string) {
    this._googleSheetsService
      .getSpreadsheet(fileId)
      .subscribe((spreadsheet) => {
        this.fileSubject.next(spreadsheet);
      });
  }

  public selectSheets(sheetSelection: SheetTableItemSelection): void {
    this.sheetSelection.emit(sheetSelection);
  }

  public selectTagData(tagData: DocumentTagData): void {
    this.tagData.emit(tagData);
  }

  public refresh(): void {
    this.load(this.fileId);
  }
}
