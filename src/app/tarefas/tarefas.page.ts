import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
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

  // tarefas padrão (SÓ servem para inicializar)
  tarefasPadrao: Tarefa[] = [
    { titulo: 'Apagar as luzes', emoji: '💡', feito: false },
    { titulo: 'Trancar a porta', emoji: '🚪', feito: false },
    { titulo: 'Desligar o gás', emoji: '🎛️', feito: false }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.carregarTarefas();
  }

  carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');

    if (tarefasSalvas) {
      // já existe estado salvo → usa ele
      this.tarefas = JSON.parse(tarefasSalvas);
    } else {
      // primeira vez abrindo o app → cria tarefas padrão
      this.tarefas = [...this.tarefasPadrao];
      this.salvarTarefas();
    }
  }

  salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(this.tarefas));
  }

  acaoTarefa(tarefa: Tarefa) {
  if (!tarefa.feito) {
    // ainda não feita → ir para fazer tarefa
    this.router.navigate(['/fazer-tarefa'], {
      state: { tarefa }
    });
  } else {
    // já feita → ir para conferir
    this.router.navigate(['/conferir-tarefa'], {
      state: { tarefa }
    });
  }
}
  adicionarTarefaUsuario(tarefa: Tarefa) {
    this.tarefas.push(tarefa);
    this.salvarTarefas();
  }

  irParaAddTarefa() {
  this.router.navigate(['/add-tarefa']);
}

voltarHome() {
  this.router.navigate(['/home']);
}

}

  