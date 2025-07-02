import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealMemoCreator } from './deal-memo-creator.component';

describe('CrateDealMemoStepper', () => {
  let component: DealMemoCreator;
  let fixture: ComponentFixture<DealMemoCreator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealMemoCreator],
    }).compileComponents();

    fixture = TestBed.createComponent(DealMemoCreator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
