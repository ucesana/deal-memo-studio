import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinnerDialog } from './spinner-dialog';

describe('SpinnerDialog', () => {
  let component: SpinnerDialog;
  let fixture: ComponentFixture<SpinnerDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpinnerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
