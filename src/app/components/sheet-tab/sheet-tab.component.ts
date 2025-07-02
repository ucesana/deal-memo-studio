import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Observable } from 'rxjs';
import { GoogleAuthService } from '../../services/google-auth.service';
import { TableDataSource, TableItem } from './table-datasource';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionChange, SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-sheet-tab',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
  ],
  templateUrl: './sheet-tab.component.html',
  styleUrl: './sheet-tab.component.scss',
})
export class SheetTabComponent implements OnInit, AfterViewInit {
  @Input() sheet!: gapi.client.sheets.Sheet;
  @Output() selected = new EventEmitter<TableItem[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<TableItem>;

  public readonly isLoggedIn$: Observable<boolean>;

  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  public dataSource = new TableDataSource();
  public displayedColumns: string[] = [];
  public selection = new SelectionModel<TableItem>(true, []);

  constructor() {
    this.isLoggedIn$ = this.googleAuthService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.selection.changed.subscribe((change: SelectionChange<TableItem>) => {
      this.selected.emit(change.source.selected);
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;

    if (this.sheet?.data?.[0]?.rowData?.length) {
      const rowData = [...this.sheet.data[0].rowData];
      const headerRowData = rowData.shift();
      if (headerRowData?.values?.length) {
        this.displayedColumns = [
          'select',
          ...headerRowData.values
            .filter(
              (cellData: gapi.client.sheets.CellData) =>
                !!cellData.userEnteredValue?.stringValue?.length,
            )
            .map(
              (cellData: gapi.client.sheets.CellData) =>
                cellData.userEnteredValue?.stringValue ?? '',
            ),
        ];
        const tableItems = rowData.map((row) => {
          const tableItem: TableItem = {};
          this.displayedColumns
            .filter((header) => header !== 'select')
            .forEach((header: string, index: string | number) => {
              tableItem[header] =
                row?.values?.[+index]?.userEnteredValue?.stringValue ?? '';
            });
          return tableItem;
        });
        (this.table.dataSource as TableDataSource).setData(tableItems);
        this.cdr.markForCheck();
      }
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
}
