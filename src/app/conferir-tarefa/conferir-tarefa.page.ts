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
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ConferirTarefaPage implements OnInit {

  tarefa!: Tarefa;
  mostrarObs = false;
  observacaoTexto: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const tarefas: Tarefa[] = JSON.parse(localStorage.getItem('tarefas') || '[]');
    const encontrada = tarefas.find(t => t.id === id);

    if (!encontrada) {
      this.router.navigate(['/tarefas']);
      return;
    }

    this.tarefa = encontrada;
  }

  formatarDataFeito(datetime: string | undefined): string {
    if (!datetime) return '';

    const dataFeito = new Date(datetime);
    if (isNaN(dataFeito.getTime())) return `Feito em ${datetime}`;

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const diaFeito = new Date(dataFeito.getFullYear(), dataFeito.getMonth(), dataFeito.getDate());

    const diffDias = Math.round((hoje.getTime() - diaFeito.getTime()) / (1000 * 60 * 60 * 24));
    const hora = dataFeito.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (diffDias === 0) return `Feito hoje às ${hora}`;
    if (diffDias === 1) return `Feito ontem às ${hora}`;
    if (diffDias === 2) return `Feito anteontem às ${hora}`;
    if (diffDias <= 7) return `Feito há ${diffDias} dias`;

    return `Feito em ${dataFeito.toLocaleDateString('pt-BR')} às ${hora}`;
  }

  async observacao() {
    if (this.tarefa.observacao) {
      const alert = await this.alertController.create({
        header: '🙀 Excluir observação',
        message: 'Tem certeza que deseja excluir a observação?',
        buttons: [
          { text: 'Não ❌', role: 'cancel', cssClass: 'btn-cancelar' },
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
    } else {
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
  }

  salvarAtualizacao() {
    const tarefas: Tarefa[] = JSON.parse(localStorage.getItem('tarefas') || '[]');
    const atualizadas = tarefas.map(t => t.id === this.tarefa.id ? { ...this.tarefa } : t);
    localStorage.setItem('tarefas', JSON.stringify(atualizadas));
  }

  voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }

  async reiniciarTarefa() {
    const alert = await this.alertController.create({
      header: '🙀 Reiniciar tarefa?',
      message: 'A tarefa, observação e lembrete serão reiniciados.',
      buttons: [
        { text: 'Não ❌',
          role: 'cancel',
          cssClass: 'btn-cancelar' },
        {
          text: 'Sim 🗑️',
          cssClass: 'btn-excluir',
          role: 'destructive',
          handler: () => {
            this.executarReset();
          }
        }
      ]
    });

    await alert.present();
  }

  private executarReset() {
    this.tarefa.feito = false;
    this.tarefa.datetime = undefined;
    this.tarefa.foto = undefined;
    this.tarefa.fotoReloads = undefined;
    this.tarefa.observacao = undefined;

    const tarefas: Tarefa[] = JSON.parse(localStorage.getItem('tarefas') || '[]');
    localStorage.setItem(
      'tarefas',
      JSON.stringify(tarefas.map(t => t.id === this.tarefa.id ? { ...this.tarefa } : t))
    );

    this.router.navigate(['/fazer-tarefa', this.tarefa.id]);
  }

  irParaLembrete() {
    this.router.navigate(
      ['/add-lembrete', this.tarefa.id],
      { queryParams: { origem: 'conferir' } }
    );
  }
}