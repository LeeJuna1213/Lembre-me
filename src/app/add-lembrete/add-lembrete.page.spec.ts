import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddLembretePage } from './add-lembrete.page';

describe('AddLembretePage', () => {
  let component: AddLembretePage;
  let fixture: ComponentFixture<AddLembretePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLembretePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
