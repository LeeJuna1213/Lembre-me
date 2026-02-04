import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Tarefa } from '../interfaces/tarefas.interfaces';
import { Router } from '@angular/router';


@Component({
  selector: 'app-tarefas',
  templateUrl: './tarefas.page.html',
  styleUrls: ['./tarefas.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, IonicModule]
})


export class TarefasPage implements OnInit {

  tarefas: Tarefa[] = [];

  tarefasPadrao: Tarefa[] = [
    { id: 1, titulo: 'Apagar as luzes', emoji: '💡', feito: false },
    { id: 2, titulo: 'Trancar a porta', emoji: '🚪', feito: false },
    { id: 3, titulo: 'Desligar o gás', emoji: '🎛️', feito: false }
  ];

  constructor(private router: Router) {}

  ngOnInit() {

  }

  carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');

    if (tarefasSalvas) {
      const tarefasParseadas: Tarefa[] = JSON.parse(tarefasSalvas);


      this.tarefas = tarefasParseadas.map((tarefa, index) => ({
        id: tarefa.id ?? Date.now() + index,
        titulo: tarefa.titulo,
        emoji: tarefa.emoji,
        feito: tarefa.feito ?? false,
        datetime: tarefa.datetime,
        foto: tarefa.foto,
        fotoReloads: tarefa.fotoReloads
      }));


      this.salvarTarefas();
    } else {
      this.tarefas = [...this.tarefasPadrao];
      this.salvarTarefas();
    }
  }

  salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(this.tarefas));
  }

  acaoTarefa(tarefa: Tarefa) {
    if (!tarefa.id) {
      console.error('Tarefa sem ID:', tarefa);
      return;
    }

    if (!tarefa.feito) {
      this.router.navigate(['/fazer-tarefa', tarefa.id]);
    } else {
      this.router.navigate(['/conferir-tarefa', tarefa.id]);
    }
  }


  ionViewWillEnter() {
    this.carregarTarefas();
  }

  irParaAddTarefa() {
    this.router.navigate(['/add-tarefa']);
  }

  voltarHome() {
    this.router.navigate(['/home']);
  }

  desfazerTodas() {
  const tarefasAtualizadas = this.tarefas.map(tarefa => ({
    ...tarefa,
    feito: false,
    datetime: undefined,
    foto: undefined,
    fotoReloads: undefined
  }));

  this.tarefas = tarefasAtualizadas;

  localStorage.setItem('tarefas', JSON.stringify(tarefasAtualizadas));
}

}


  