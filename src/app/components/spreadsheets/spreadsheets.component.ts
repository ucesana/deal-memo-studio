import { AfterViewInit, Component, inject, Input, OnInit } from '@angular/core';
import { GoogleAuthService } from '../../services/google-auth.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { LastVisitedService } from '../../services/last-visited-service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, filter, Observable, Subject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  SheetTableItemSelection,
  SpreadsheetTableComponent,
} from '../spreadsheet-table/spreadsheet-table.component';
import { AsyncPipe } from '@angular/common';
import { DocumentTagData } from '../../services/tag.service';
import { map, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-spreadsheets',
  imports: [SpreadsheetTableComponent, AsyncPipe],
  templateUrl: './spreadsheets.component.html',
  styleUrl: './spreadsheets.component.scss',
})
export class SpreadsheetsComponent implements OnInit, AfterViewInit {
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly googleSheetsService = inject(GoogleSheetsService);
  private readonly lastVisited = inject(LastVisitedService);
  private readonly route = inject(ActivatedRoute);

  @Input() id: string = '';

  private _spreadsheetSubject: Subject<any> = new BehaviorSubject(null);

  public isLoggedIn$: Observable<boolean>;
  public spreadsheet$: Observable<gapi.client.sheets.Spreadsheet>;

  constructor() {
    this.isLoggedIn$ = this.googleAuthService.getIsLoggedIn();
    this.spreadsheet$ = this._spreadsheetSubject
      .asObservable()
      .pipe(filter((o) => !!o));
  }

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.lastVisited.setLastSpreadsheetId(id);
    }
  }

  public ngAfterViewInit(): void {
    this.isLoggedIn$
      .pipe(untilDestroyed(this))
      .subscribe((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          if (this.id?.length) {
            this.loadSpreadsheet(this.id);
          }
        }
      });
  }

  public selectSheets(sheetSelection: SheetTableItemSelection): void {}

  public selectTagData(tagData: DocumentTagData): void {}

  public loadSpreadsheet(id: string): void {
    this.googleSheetsService
      .getSpreadsheet(id)
      .pipe(
        take(1),
        filter((o) => !!o),
      )
      .subscribe((spreadsheet) => {
        this._spreadsheetSubject.next(spreadsheet);
      });
  }
}
