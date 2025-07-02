import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileIcon } from './file-icon.component';

describe('FileIconComponent', () => {
  let component: FileIcon;
  let fixture: ComponentFixture<FileIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(FileIcon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
