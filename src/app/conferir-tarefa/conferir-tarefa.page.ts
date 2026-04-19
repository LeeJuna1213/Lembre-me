import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tarefa } from '../interfaces/tarefas.interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular';

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
    private router: Router,
    private alertController: AlertController
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
  mostrarObs = false;
  observacaoTexto: string = '';

  async observacao() {
    // SE JÁ EXISTE OBSERVAÇÃO → PERGUNTA SE QUER EXCLUIR
    if (this.tarefa.observacao) {
      const alert = await this.alertController.create({
        header: '🙀 Excluir observação',
        message: 'Tem certeza que deseja excluir a observação?',
        buttons: [
          {
            text: 'Não ❌',
            role: 'cancel',
            cssClass: 'btn-cancelar'
          },
          {
            text: 'Sim 🗑️',
            role: 'destructive',
            cssClass: 'btn-excluir',
            handler: () => {
              this.tarefa.observacao = '';
              this.observacaoTexto = '';
              this.mostrarObs = false;
              this.salvarAtualizacao();
            }
          }
        ]
      });

      await alert.present();
    } 
    // SE NÃO EXISTE → MOSTRA O CAMPO PARA ESCREVER
    else {
      this.mostrarObs = true;
    }
  }

  salvarObservacao() {
    if (!this.observacaoTexto.trim()) return;

    this.tarefa.observacao = this.observacaoTexto.trim();
    this.observacaoTexto = '';
    this.mostrarObs = false;

    this.salvarAtualizacao();
  }
  fecharObservacao() {
    this.mostrarObs = false;
    this.observacaoTexto = ''; 
  }

  salvarAtualizacao() {
    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.map(t =>
      t.id === this.tarefa.id ? { ...this.tarefa } : t
    );

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));
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
  
  irParaLembrete() {
    this.router.navigate(
      ['/add-lembrete', this.tarefa.id],
      { queryParams: { origem: 'conferir' } }
    );
  }
}

