import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Etiqueta, Tarefa } from '../interfaces/tarefas.interfaces';
import { Router } from '@angular/router';
import { NotificacoesService } from '../services/notificacoes.services';
import { AlertController } from '@ionic/angular';
import { ETIQUETAS } from '../constants/etiqueta.constants';

@Component({
  selector: 'app-tarefas',
  templateUrl: './tarefas.page.html',
  styleUrls: ['./tarefas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class TarefasPage {

  tarefas: Tarefa[] = [];
  readonly etiquetas = ETIQUETAS;


  tarefasPadrao: Tarefa[] = [
    { id: 1, titulo: 'Apagar as luzes', emoji: '💡', feito: false },
    { id: 2, titulo: 'Trancar a porta', emoji: '🚪', feito: false },
    { id: 3, titulo: 'Desligar o gás', emoji: '🎛️', feito: false }
  ];

  constructor(
    private router: Router,
    private notificacoes: NotificacoesService,
    private alertCtrl: AlertController,
  ) { }

  ionViewWillEnter() {
    this.carregarTarefas();
  }

  carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');

    if (tarefasSalvas) {
      // ✅ Parse direto — preserva todos os campos, inclusive lembrete
      this.tarefas = JSON.parse(tarefasSalvas);
    } else {
      // Primeira vez: inicializa padrão e garante que proximo_id não colide
      this.tarefas = [...this.tarefasPadrao];
      if (!localStorage.getItem('proximo_id')) {
        localStorage.setItem('proximo_id', '4'); // ✅ IDs 1,2,3 já usados pelas padrão
      }
      this.salvarTarefas();
    }
  }

  salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(this.tarefas));
  }

  // ✅ trackBy evita re-renderização desnecessária que causava a duplicação visual
  trackById(index: number, tarefa: Tarefa): number {
    return tarefa.id;
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


  irParaAddTarefa() {
    this.router.navigate(['/add-tarefa']);
  }

  voltarHome() {
    this.router.navigate(['/home']);
  }

  async desfazerTodas() {
    const alert = await this.alertCtrl.create({
      header: '🙀 Resetar tudo?',
      message: 'Todas as tarefas e lembretes serão resetadas.',
      buttons: [
        {
          text: 'Não ❌',
          role: 'cancel',
          cssClass: 'btn-cancelar'
        },
        {
          text: 'Sim 🗑️',
          cssClass: 'btn-excluir',
          role: 'destructive',
          handler: async () => {
            await this.notificacoes.cancelarTodas();

            this.tarefas = this.tarefas.map(tarefa => ({
              ...tarefa,
              feito: false,
              lembrete: undefined,
              datetime: undefined,
              foto: undefined,
              fotoReloads: undefined
            }));

            this.salvarTarefas();
          }
        }
      ]
    });

    await alert.present();
  }

  textoLembrete(tarefa: Tarefa): string {
    const lembrete = tarefa.lembrete;
    if (!lembrete) return '';

    const hora = lembrete.hora; // "HH:mm"
    const agora = new Date();

    // cria uma data com HOJE no horário do lembrete
    const [h, m] = hora.split(':').map(Number);
    const dataLembreteHoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
      h,
      m,
      0
    );

    // ⏰ se o horário já passou hoje, não mostra texto
    if (dataLembreteHoje <= agora) {
      return '';
    }

    // 🗓️ Apenas um dia
    if (lembrete.tipo === 'umdia') {
      return `Hoje às ${hora}`;
    }

    // 🔁 Diário
    if (lembrete.tipo === 'diario') {
      return `Hoje às ${hora}`;
    }

    // 📅 Semanal
    if (lembrete.tipo === 'semanal') {
      const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      const dias = (lembrete.diasSemana || [])
        .map(d => nomesDias[d])
        .join(', ');

      return `Semanal: ${dias} às ${hora}`;
    }

    return '';
  }

  formatarDataFeito(datetime: string | undefined): string {
    if (!datetime) return '';

    const dataFeito = new Date(datetime); // ✅ aceita ISO e toLocaleString
    if (isNaN(dataFeito.getTime())) return `Feito em ${datetime}`;

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const diaFeito = new Date(dataFeito.getFullYear(), dataFeito.getMonth(), dataFeito.getDate());

    const diffDias = Math.round((hoje.getTime() - diaFeito.getTime()) / (1000 * 60 * 60 * 24));

    const hora = dataFeito.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (diffDias === 0) return `Feito hoje às ${hora}`;
    if (diffDias === 1) return `Feito ontem`;
    if (diffDias === 2) return `Feito anteontem`;
    if (diffDias <= 7) return `Feito há ${diffDias} dias`;

    return `Feito em ${dataFeito.toLocaleDateString('pt-BR')}`; // dd/mm/aaaa
  }


  getEtiquetas(tarefa: Tarefa): Etiqueta[] {
    if (!tarefa.etiquetas?.length) return [];
    return this.etiquetas.filter(e => tarefa.etiquetas!.includes(e.id));
  }
}