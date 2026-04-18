import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tarefa } from '../interfaces/tarefas.interfaces';
import { NotificacoesService } from '../services/notificacoes.services';

@Component({
  selector: 'app-add-lembrete',
  templateUrl: './add-lembrete.page.html',
  styleUrls: ['./add-lembrete.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddLembretePage implements OnInit {

  id!: number;
  tarefa!: Tarefa;
  tituloTarefa = '';

  origem: 'fazer' | 'conferir' = 'fazer';

  recorrencia: 'umdia' | 'diario' | 'semanal' = 'diario';
  horarioISO = '';

  diasSemana = [
    { nome: 'Dom', valor: 0, selecionado: false },
    { nome: 'Seg', valor: 1, selecionado: false },
    { nome: 'Ter', valor: 2, selecionado: false },
    { nome: 'Qua', valor: 3, selecionado: false },
    { nome: 'Qui', valor: 4, selecionado: false },
    { nome: 'Sex', valor: 5, selecionado: false },
    { nome: 'Sab', valor: 6, selecionado: false }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificacoes: NotificacoesService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.id) {
      this.router.navigate(['/tarefas']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      if (params['origem']) {
        this.origem = params['origem'];
      }
    });

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const tarefa = tarefas.find(t => t.id === this.id);

    if (!tarefa) {
      this.router.navigate(['/tarefas']);
      return;
    }

    this.tarefa = tarefa;
    this.tituloTarefa = tarefa.titulo;

    // 🔄 Carrega lembrete existente
    if (tarefa.lembrete) {
      const lembrete = tarefa.lembrete;

      this.recorrencia = lembrete.tipo;
      this.horarioISO = this.hhmmParaISO(lembrete.hora);

      if (lembrete.tipo === 'semanal') {
        this.diasSemana.forEach(d =>
          d.selecionado = lembrete.diasSemana?.includes(d.valor) ?? false
        );
      }
    }
  }

  private hhmmParaISO(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  private isoParaHHmm(iso: string): string {
    return iso.substring(11, 16);
  }

  toggleDia(dia: any) {
    dia.selecionado = !dia.selecionado;
  }

  async salvarLembrete() {
    if (!this.horarioISO) return;

    const lembrete: any = {
      tipo: this.recorrencia,
      hora: this.isoParaHHmm(this.horarioISO)
    };

    if (this.recorrencia === 'semanal') {
      lembrete.diasSemana = this.diasSemana
        .filter(d => d.selecionado)
        .map(d => d.valor);
    }

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const index = tarefas.findIndex(t => t.id === this.id);
    if (index === -1) return;

    tarefas[index].lembrete = lembrete;
    localStorage.setItem('tarefas', JSON.stringify(tarefas));

    // 🔔 Agenda notificações
    await this.notificacoes.agendar(tarefas[index]);

    this.voltar();
  }

  async desfazerUma() {
    const alert = await this.alertCtrl.create({
      header: '🙀 Remover lembrete',
      message: `Deseja apagar o lembrete da tarefa "${this.tituloTarefa}"?`,
      buttons: [
        { text: 'Não ❌',
          role: 'cancel',
          cssClass: 'btn-cancelar'
        },
        {
          text: 'Sim 🗑️',
          cssClass: 'btn-excluir',
          role: 'destructive',
          handler: async () => {
            await this.notificacoes.cancelar(this.id);

            const tarefas: Tarefa[] =
              JSON.parse(localStorage.getItem('tarefas') || '[]');

            const index = tarefas.findIndex(t => t.id === this.id);
            if (index === -1) return;

            delete tarefas[index].lembrete;
            localStorage.setItem('tarefas', JSON.stringify(tarefas));

            this.voltar();
          }
        }
      ]
    });

    await alert.present();
  }

  voltar() {
    if (this.origem === 'conferir') {
      this.router.navigate(['/conferir-tarefa', this.id]);
    } else {
      this.router.navigate(['/fazer-tarefa', this.id]);
    }
  }
}