import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathBreadcrumb } from './path-breadcrumb';

describe('PathBreadcrumb', () => {
  let component: PathBreadcrumb;
  let fixture: ComponentFixture<PathBreadcrumb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathBreadcrumb]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PathBreadcrumb);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
