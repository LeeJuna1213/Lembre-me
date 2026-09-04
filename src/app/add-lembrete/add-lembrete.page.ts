import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';

import { FormsModule } from '@angular/forms';
import { Tarefa } from '../interfaces/tarefas.interfaces';
import { NotificacoesService } from '../services/notificacoes.services';
import { RelogioHorarioComponent } from '../shared/relogio-horario/relogio-horario.component';

@Component({
  selector: 'app-add-lembrete',
  templateUrl: './add-lembrete.page.html',
  styleUrls: ['./add-lembrete.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, RelogioHorarioComponent],
})
export class AddLembretePage implements OnInit {
  id!: number;
  tarefa!: Tarefa;
  tituloTarefa = '';

  origem: 'fazer' | 'conferir' = 'fazer';

  recorrencia: 'umdia' | 'diario' | 'semanal' = 'diario';
  // Horário no formato "HH:mm" (24h), o mesmo já usado em tarefa.lembrete.hora.
  horario = this.horaAtualFormatada();

  diasSemana = [
    { nome: 'Dom', valor: 0, selecionado: false },
    { nome: 'Seg', valor: 1, selecionado: false },
    { nome: 'Ter', valor: 2, selecionado: false },
    { nome: 'Qua', valor: 3, selecionado: false },
    { nome: 'Qui', valor: 4, selecionado: false },
    { nome: 'Sex', valor: 5, selecionado: false },
    { nome: 'Sab', valor: 6, selecionado: false },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificacoes: NotificacoesService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.origem =
      (this.route.snapshot.queryParamMap.get('origem') as any) || 'fazer';

    if (!this.id) {
      this.router.navigate(['/tarefas']);
      return;
    }

    const tarefas: Tarefa[] = JSON.parse(
      localStorage.getItem('tarefas') || '[]'
    );

    const tarefa = tarefas.find((t) => t.id === this.id);

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
      this.horario = lembrete.hora;

      if (lembrete.tipo === 'semanal') {
        this.diasSemana.forEach(
          (d) =>
            (d.selecionado = lembrete.diasSemana?.includes(d.valor) ?? false)
        );
      }
    }
  }

  private horaAtualFormatada(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  }

  toggleDia(dia: any) {
    dia.selecionado = !dia.selecionado;
  }

  async salvarLembrete() {
    if (!this.horario) return;

    const lembrete: any = {
      tipo: this.recorrencia,
      hora: this.horario,
    };

    if (this.recorrencia === 'semanal') {
      lembrete.diasSemana = this.diasSemana
        .filter((d) => d.selecionado)
        .map((d) => d.valor);
    }

    const tarefas: Tarefa[] = JSON.parse(
      localStorage.getItem('tarefas') || '[]'
    );

    const index = tarefas.findIndex((t) => t.id === this.id);
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
        { text: 'Não ❌', role: 'cancel', cssClass: 'btn-cancelar' },
        {
          text: 'Sim 🗑️',
          cssClass: 'btn-excluir',
          role: 'destructive',
          handler: async () => {
            await this.notificacoes.cancelar(this.id);

            const tarefas: Tarefa[] = JSON.parse(
              localStorage.getItem('tarefas') || '[]'
            );

            const index = tarefas.findIndex((t) => t.id === this.id);
            if (index === -1) return;

            delete tarefas[index].lembrete;
            localStorage.setItem('tarefas', JSON.stringify(tarefas));

            this.voltar();
          },
        },
      ],
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
