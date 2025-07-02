import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetTabComponent } from './sheet-tab.component';

describe('SheetComponent', () => {
  let component: SheetTabComponent;
  let fixture: ComponentFixture<SheetTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheetTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheetTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
