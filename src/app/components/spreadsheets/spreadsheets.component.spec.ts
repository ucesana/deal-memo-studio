import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpreadsheetsComponent } from './spreadsheets.component';

describe('SpreadsheetsComponent', () => {
  let component: SpreadsheetsComponent;
  let fixture: ComponentFixture<SpreadsheetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpreadsheetsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpreadsheetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
