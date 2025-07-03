import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealMemoConsole } from './deal-memo-console';

describe('DealMemoConsole', () => {
  let component: DealMemoConsole;
  let fixture: ComponentFixture<DealMemoConsole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealMemoConsole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealMemoConsole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
