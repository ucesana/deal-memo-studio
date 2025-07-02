import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import {
  SheetTableItemSelection,
  SpreadsheetTableComponent,
} from '../spreadsheet-table/spreadsheet-table.component';
import { AsyncPipe } from '@angular/common';
import { DocumentTagData } from '../../services/tag.service';
import { filter, Observable } from 'rxjs';
import { DealMemoService } from '../../services/deal-memo.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-tag-selector',
  imports: [SpreadsheetTableComponent, AsyncPipe],
  templateUrl: './tag-selector.component.html',
  styleUrl: './tag-selector.component.scss',
})
export class TagSelectorComponent {
  @Output() sheetSelection: EventEmitter<SheetTableItemSelection> =
    new EventEmitter();
  @Output() tagData: EventEmitter<DocumentTagData> = new EventEmitter();

  @ViewChild('spreadsheetTable') spreadsheetTable?: SpreadsheetTableComponent;

  public spreadsheet$: Observable<gapi.client.sheets.Spreadsheet>;

  constructor(private readonly dealMemoService: DealMemoService) {
    this.spreadsheet$ = this.dealMemoService
      .getUserDataSpreadsheet()
      .pipe(filter((o) => !!o));
  }

  public selectSheets(sheetSelection: SheetTableItemSelection): void {
    this.sheetSelection.emit(sheetSelection);
  }

  public selectTagData(tagData: DocumentTagData): void {
    this.tagData.emit(tagData);
  }

  public reload(): void {
    this.dealMemoService.loadUserData();
  }

  public refresh(): void {
    this.spreadsheetTable?.refresh();
  }
}
