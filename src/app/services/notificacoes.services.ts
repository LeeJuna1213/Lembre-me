import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Tarefa } from '../interfaces/tarefas.interfaces';

@Injectable({ providedIn: 'root' })
export class NotificacoesService {

  private nomeDia(dia: number): string {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[dia];
  }

  private baseId(tarefaId: number): number {
    return tarefaId * 10;
  }

  private proximaData(hora: number, minuto: number, weekday?: number): Date {
    const agora = new Date();
    const data = new Date();

    data.setHours(hora, minuto, 0, 0);

    // ⏰ Apenas um dia / diário
    if (weekday === undefined) {
      if (data <= agora) data.setDate(data.getDate() + 1);
      return data;
    }

    // 📅 Semanal
    const hoje = agora.getDay();
    let diff = weekday - hoje;
    if (diff < 0 || (diff === 0 && data <= agora)) diff += 7;

    data.setDate(data.getDate() + diff);
    return data;
  }

  // 🧹 Cancela notificações de UMA tarefa
  async cancelar(tarefaId: number) {
    const base = this.baseId(tarefaId);
    const ids = Array.from({ length: 8 }, (_, i) => ({ id: base + i }));
    await LocalNotifications.cancel({ notifications: ids });
  }

  // 🔥 Cancela TODAS as notificações
  async cancelarTodas() {
    const pendentes = await LocalNotifications.getPending();

    if (pendentes.notifications.length) {
      await LocalNotifications.cancel({
        notifications: pendentes.notifications.map(n => ({ id: n.id }))
      });
    }
  }

  async agendar(tarefa: Tarefa) {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted' || !tarefa.lembrete) return;

    // 🛑 Remove notificações antigas da tarefa
    await this.cancelar(tarefa.id);

    const [hora, minuto] = tarefa.lembrete.hora.split(':').map(Number);
    const base = this.baseId(tarefa.id);
    const notificacoes: any[] = [];

    const extra = { tarefaId: tarefa.id };

    // 🗓️ Apenas um dia
    if (tarefa.lembrete.tipo === 'umdia') {
      notificacoes.push({
        id: base,
        title: '🗓️ Lembrete',
        body: tarefa.titulo,
        smallIcon: 'ic_stat_name',
        channelId: 'lembretes',
        extra,
        schedule: {
          at: this.proximaData(hora, minuto),
          allowWhileIdle: true
        }
      });
    }

    // 🔁 Diário
    if (tarefa.lembrete.tipo === 'diario') {
      notificacoes.push({
        id: base,
        title: '⏰ Lembrete Diário',
        body: tarefa.titulo,
        smallIcon: 'ic_stat_name',
        channelId: 'lembretes',
        extra,
        schedule: {
          at: this.proximaData(hora, minuto),
          every: 'day',
          allowWhileIdle: true
        }
      });
    }

    // 📅 Semanal
    if (
      tarefa.lembrete.tipo === 'semanal' &&
      tarefa.lembrete.diasSemana?.length
    ) {
      const diasTexto = tarefa.lembrete.diasSemana
        .map(d => this.nomeDia(d))
        .join(', ');

      tarefa.lembrete.diasSemana.forEach((dia, i) => {
        notificacoes.push({
          id: base + i + 1,
          title: '📅 Lembrete Semanal',
          body: `${tarefa.titulo} • ${diasTexto}`,
          smallIcon: 'ic_stat_name',
          channelId: 'lembretes',
          extra,
          schedule: {
            at: this.proximaData(hora, minuto, dia),
            every: 'week',
            allowWhileIdle: true
          }
        });
      });
    }

    if (notificacoes.length) {
      await LocalNotifications.schedule({ notifications: notificacoes });
    }
  }
}