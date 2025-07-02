import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriveList } from './drive-list';

describe('DriveList', () => {
  let component: DriveList;
  let fixture: ComponentFixture<DriveList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriveList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriveList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
