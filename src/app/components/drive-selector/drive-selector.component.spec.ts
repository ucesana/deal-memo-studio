import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriveSelectorComponent } from './drive-selector.component';

describe('DriveSelector', () => {
  let component: DriveSelectorComponent;
  let fixture: ComponentFixture<DriveSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriveSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DriveSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
