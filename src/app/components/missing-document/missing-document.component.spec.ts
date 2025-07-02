import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissingDocumentComponent } from './missing-document.component';

describe('NoDocumentSelectedComponent', () => {
  let component: MissingDocumentComponent;
  let fixture: ComponentFixture<MissingDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissingDocumentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MissingDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
