import { AfterViewInit, Component, inject, Input, OnInit } from '@angular/core';
import { GoogleAuthService } from '../../services/google-auth.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { AppSettingsService } from '../../services/app-settings.service';
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
  private readonly _googleAuthService = inject(GoogleAuthService);
  private readonly _googleSheetsService = inject(GoogleSheetsService);
  private readonly _appSettingsService = inject(AppSettingsService);
  private readonly _route = inject(ActivatedRoute);

  private _spreadsheetSubject: Subject<any> = new BehaviorSubject(null);

  public id: string = '';

  public isLoggedIn$: Observable<boolean>;
  public spreadsheet$: Observable<gapi.client.sheets.Spreadsheet>;

  constructor() {
    this.isLoggedIn$ = this._googleAuthService.getIsLoggedIn();
    this.spreadsheet$ = this._spreadsheetSubject
      .asObservable()
      .pipe(filter((o) => !!o));
  }

  public ngOnInit(): void {
    this.id =
      this._route.snapshot.paramMap.get('id') ??
      this._appSettingsService.getLastSpreadsheetId() ??
      '';
    if (this.id) {
      this._appSettingsService.setLastSpreadsheetId(this.id);
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
    this._googleSheetsService
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
