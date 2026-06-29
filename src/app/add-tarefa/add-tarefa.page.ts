import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Tarefa } from '../interfaces/tarefas.interfaces';
import { NotificacoesService } from '../services/notificacoes.services';
import { ETIQUETAS } from '../constants/etiqueta.constants';

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
  etiquetasSelecionadas: string[] = [];
  private _lembreteTemp: any = null;

  readonly etiquetas = ETIQUETAS;

  constructor(
    private router: Router,
    private notificacoes: NotificacoesService
  ) {}

  ionViewWillEnter() {
    const state = history.state;
    this._lembreteTemp = state?.lembreteTemp ?? null;
    if (state?.titulo !== undefined) this.titulo = state.titulo;
    if (state?.emoji  !== undefined) this.emoji  = state.emoji;
    if (state?.etiquetasSelecionadas) this.etiquetasSelecionadas = state.etiquetasSelecionadas;
  }

  toggleEtiqueta(id: string) {
    const index = this.etiquetasSelecionadas.indexOf(id);
    if (index === -1) {
      this.etiquetasSelecionadas.push(id);
    } else {
      this.etiquetasSelecionadas.splice(index, 1);
    }
  }

  etiquetaSelecionada(id: string): boolean {
    return this.etiquetasSelecionadas.includes(id);
  }

  async adicionarTarefa() {
    if (!this.titulo.trim() || !this.emoji.trim()) return;

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const proximoId = Number(localStorage.getItem('proximo_id') ?? '4');
    localStorage.setItem('proximo_id', String(proximoId + 1));

    const novaTarefa: Tarefa = {
      id: proximoId,
      titulo: this.titulo.trim(),
      emoji: this.emoji.trim(),
      feito: false,
      ...(this.etiquetasSelecionadas.length && { etiquetas: [...this.etiquetasSelecionadas] })
    };

    if (this._lembreteTemp) novaTarefa.lembrete = this._lembreteTemp;

    tarefas.push(novaTarefa);
    localStorage.setItem('tarefas', JSON.stringify(tarefas));

    if (novaTarefa.lembrete) await this.notificacoes.agendar(novaTarefa);

    this._lembreteTemp = null;
    this.titulo = '';
    this.emoji = '';
    this.etiquetasSelecionadas = [];

    this.router.navigate(['/tarefas']);
  }

  irParaLembrete() {
    this.router.navigate(['/add-lembrete', 0], {
      queryParams: { origem: 'add' },
      state: {
        lembreteTemp: this._lembreteTemp ?? null,
        titulo: this.titulo,
        emoji: this.emoji,
        etiquetasSelecionadas: this.etiquetasSelecionadas
      }
    });
  }

  voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }
}