import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FazerTarefaPage } from './fazer-tarefa.page';

describe('FazerTarefaPage', () => {
  let component: FazerTarefaPage;
  let fixture: ComponentFixture<FazerTarefaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FazerTarefaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
