import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConferirTarefaPage } from './conferir-tarefa.page';

describe('ConferirTarefaPage', () => {
  let component: ConferirTarefaPage;
  let fixture: ComponentFixture<ConferirTarefaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConferirTarefaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
