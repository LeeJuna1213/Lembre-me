import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Tarefa } from '../interfaces/tarefas.interfaces';

@Component({
  selector: 'app-add-tarefa',
  templateUrl: './add-tarefa.page.html',
  styleUrls: ['./add-tarefa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AddTarefaPage {

  titulo: string = '';
  emoji: string = '';

  constructor(private router: Router) {}

  adicionarTarefa() {
    // validação básica
    if (!this.titulo.trim() || !this.emoji.trim()) {
      return;
    }

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const novaTarefa: Tarefa = {
      id: Date.now(), // id único simples
      titulo: this.titulo.trim(),
      emoji: this.emoji.trim(),
      feito: false
    };

    tarefas.push(novaTarefa);

    localStorage.setItem('tarefas', JSON.stringify(tarefas));

    this.router.navigate(['/tarefas']);
  }

  voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }
}
