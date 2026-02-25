import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjInput } from './input';

describe('AjInput', () => {
  let component: AjInput;
  let fixture: ComponentFixture<AjInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
