import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpreadsheetTableComponent } from './spreadsheet-table.component';

describe('TableComponent', () => {
  let component: SpreadsheetTableComponent;
  let fixture: ComponentFixture<SpreadsheetTableComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SpreadsheetTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
