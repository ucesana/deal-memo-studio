import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriveTreeComponent } from './drive-tree.component';

describe('TreeComponent', () => {
  let component: DriveTreeComponent;
  let fixture: ComponentFixture<DriveTreeComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DriveTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
