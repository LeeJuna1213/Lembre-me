import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddNotaPage } from './add-nota.page';

describe('AddNotaPage', () => {
  let component: AddNotaPage;
  let fixture: ComponentFixture<AddNotaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNotaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
