import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Observable } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GoogleAuthService } from '../../services/google-auth.service';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { SheetTabComponent } from '../sheet-tab/sheet-tab.component';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TableItem } from '../sheet-tab/table-datasource';
import { DocumentTagData } from '../../services/tag.service';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatSidenavContainer,
  MatSidenavModule,
} from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { TagData } from '../tag-data/tag-data';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';

export type SheetTableItemSelection = Record<string, TableItem[]>;

@UntilDestroy()
@Component({
  selector: 'app-spreadsheet-table',
  templateUrl: './spreadsheet-table.component.html',
  styleUrl: './spreadsheet-table.component.scss',
  imports: [
    MatTabGroup,
    MatTab,
    SheetTabComponent,
    AsyncPipe,
    MatProgressSpinner,
    MatSidenavModule,
    MatSidenavContainer,
    MatIcon,
    MatIconButton,
    MatButton,
    TagData,
    MatToolbar,
    MatTooltip,
  ],
})
export class SpreadsheetTableComponent implements OnChanges {
  @Input() spreadsheet: gapi.client.sheets.Spreadsheet | null = null;
  @Input() height: string = '100vh';
  @Output() sheetsSelection: EventEmitter<SheetTableItemSelection> =
    new EventEmitter<SheetTableItemSelection>();
  @Output() tagData: EventEmitter<DocumentTagData> =
    new EventEmitter<DocumentTagData>();
  @Output() reload: EventEmitter<boolean> = new EventEmitter<boolean>();

  public isLoggedIn$: Observable<boolean>;
  public tagData$: Observable<DocumentTagData>;

  public sheets: gapi.client.sheets.Sheet[] = [];
  public isPanelOpen = false;

  private _sheetsSelection: SheetTableItemSelection = {};

  constructor(private readonly googleAuthService: GoogleAuthService) {
    this.initSheetSelections();

    this.isLoggedIn$ = this.googleAuthService.getIsLoggedIn();
    this.tagData$ = this.tagData.asObservable();

    this.sheetsSelection
      .asObservable()
      .pipe(untilDestroyed(this))
      .subscribe((sheetsSelection) => {
        this.tagData.emit(
          this.generatePages(this.generateTagData(sheetsSelection)),
        );
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['spreadsheet']) {
      this.spreadsheet = changes['spreadsheet'].currentValue;
      this.initSheetSelections();
    }
  }

  public refresh(): void {
    this.spreadsheet = null;
    this.initSheetSelections();
    this.sheetsSelection.emit({});
    this.tagData.emit([]);
    this.reload.emit(true);
  }

  private initSheetSelections(): void {
    this._sheetsSelection = {};
    const sheets = this.spreadsheet?.sheets ?? [];
    sheets.forEach((sheet) => {
      if (sheet?.properties?.title?.length) {
        this._sheetsSelection[sheet.properties.title] = [];
      }
    });
  }

  private generatePages(tagData: string[][][][]): DocumentTagData {
    function cartesianProduct<T>(arrays: T[][]): T[][] {
      return arrays.reduce<T[][]>(
        (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
        [[]],
      );
    }

    const filteredTagData = tagData.filter((sheet) => sheet.length > 0);
    const product = cartesianProduct(filteredTagData);
    return product.map((combo) => {
      return [
        ...combo.flat().sort((a, b) =>
          a[0].localeCompare(b[0], undefined, {
            numeric: true,
            sensitivity: 'base',
          }),
        ),
      ];
    });
  }

  private generateTags(spreadsheet: any): string[] {
    const spreadsheetData: { [sheetName: string]: string[][] } = {};
    for (let i = 0; i < spreadsheet.sheets.length; i++) {
      const sheet = spreadsheet.sheets[i];
      const rowData = [...sheet.data[0].rowData];
      spreadsheetData[sheet.properties.title] = [];
      for (let j = 0; j < rowData.length; j++) {
        const row = rowData[j];
        spreadsheetData[sheet.properties.title].push([
          ...row.values.map(
            (value: { userEnteredValue: { stringValue: string } }) =>
              value.userEnteredValue.stringValue,
          ),
        ]);
      }
    }
    return this.generateSheetColumnTags(spreadsheetData);
  }

  generateSheetColumnTags(spreadsheet: {
    [sheetName: string]: string[][];
  }): string[] {
    const tags: string[] = [];

    for (const sheetName in spreadsheet) {
      if (!spreadsheet.hasOwnProperty(sheetName)) continue;
      const rows = spreadsheet[sheetName];
      if (!rows || rows.length === 0) continue;
      const headers = rows[0]; // Header row (array of column names)
      if (!headers || headers.length === 0) continue;

      for (const header of headers) {
        // Capitalize each word in sheet and header name
        const tag = `${this.capitalizeWords(sheetName)} ${this.capitalizeWords(header)}`;
        tags.push(tag);
      }
    }

    return tags;
  }

  capitalizeWords(str: string): string {
    return str.replace(
      /\b\w+/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
  }

  selectedRows(sheet: any, rows: TableItem[]) {
    this._sheetsSelection[sheet.properties.title] = rows;
    this.sheetsSelection.next(this._sheetsSelection);
  }

  private generateTagData(
    sheetSelection: Record<string, Record<string, string>[]>,
  ): string[][][][] {
    const flatTags: string[][][][] = [];
    for (const [sheetName, rowData] of Object.entries(sheetSelection)) {
      const sheetTags: string[][][] = [];
      rowData.forEach((row) => {
        const rowTags: string[][] = [];
        for (const [columnName, columnValue] of Object.entries(row)) {
          const tagName = `${sheetName} ${columnName}`;
          rowTags.push([tagName, columnValue]);
        }
        sheetTags.push(rowTags);
      });
      flatTags.push(sheetTags);
    }
    return flatTags;
  }
}
