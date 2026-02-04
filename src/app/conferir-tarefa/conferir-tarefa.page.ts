import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tarefa } from '../interfaces/tarefas.interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-conferir-tarefa',
  templateUrl: './conferir-tarefa.page.html',
  styleUrls: ['./conferir-tarefa.page.scss'],
  standalone: true,
  imports:[IonicModule, CommonModule, FormsModule]
})

export class ConferirTarefaPage implements OnInit {

  tarefa!: Tarefa;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const encontrada = tarefas.find(t => t.id === id);

    if (!encontrada) {
      this.router.navigate(['/tarefas']);
      return;
    }

    this.tarefa = encontrada;
  }

   voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }
  
    reiniciarTarefa() {
    this.tarefa.feito = false;
    this.tarefa.datetime = undefined;
    this.tarefa.foto = undefined;
    this.tarefa.fotoReloads = undefined;

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.map(t =>
      t.id === this.tarefa.id ? { ...this.tarefa } : t
    );

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));

    this.router.navigate(['/fazer-tarefa', this.tarefa.id]);
  }
}

