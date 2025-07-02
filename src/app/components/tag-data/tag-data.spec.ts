import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagData } from './tag-data';

describe('TagData', () => {
  let component: TagData;
  let fixture: ComponentFixture<TagData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagData],
    }).compileComponents();

    fixture = TestBed.createComponent(TagData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
