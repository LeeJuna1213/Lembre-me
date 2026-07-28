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

    // 🗓️ Apenas hoje — dispara uma única vez, hoje, no horário escolhido.
    // Se o horário já passou, não agenda (não deve "vazar" pro dia seguinte).
    if (tarefa.lembrete.tipo === 'umdia') {
      const agora = new Date();
      const disparo = new Date();
      disparo.setHours(hora, minuto, 0, 0);

      if (disparo > agora) {
        notificacoes.push({
          id: base,
          title: '🗓️ Lembrete',
          body: tarefa.titulo,
          smallIcon: 'ic_stat_name',
          channelId: 'lembretes_v2',
          sound: 'toque.mp4',
          extra,
          schedule: {
            at: disparo,
            allowWhileIdle: true,
            repeats: false
          }
        });
      }
    }

    // 🔁 Diário — usar só "on" (sem "every"): campos não informados (dia/mês)
    // ciclam sozinhos, então já dispara todo dia nesse horário.
    if (tarefa.lembrete.tipo === 'diario') {
      notificacoes.push({
        id: base,
        title: '⏰ Lembrete Diário',
        body: tarefa.titulo,
        smallIcon: 'ic_stat_name',
        channelId: 'lembretes_v2',
        sound: 'toque.mp4',
        extra,
        schedule: {
          on: { hour: hora, minute: minuto },
          allowWhileIdle: true
        }
      });
    }

    // 📅 Semanal — mesma lógica: só "on" com weekday fixo já repete toda semana.
    if (tarefa.lembrete.tipo === 'semanal' && tarefa.lembrete.diasSemana?.length) {
      tarefa.lembrete.diasSemana.forEach((dia, i) => {
        notificacoes.push({
          id: base + i + 1,
          title: '📅 Lembrete Semanal',
          body: `${tarefa.titulo} • ${tarefa.lembrete!.diasSemana!.map(d => this.nomeDia(d)).join(', ')}`,
          smallIcon: 'ic_stat_name',
          channelId: 'lembretes_v2',
        sound: 'toque.mp4',
          extra,
          schedule: {
            on: { weekday: dia + 1, hour: hora, minute: minuto }, // Capacitor: 1=Dom..7=Sab
            allowWhileIdle: true
          }
        });
      });
    }

    if (notificacoes.length) {
      await LocalNotifications.schedule({ notifications: notificacoes });
    }
  }

  // 🔁 Avisa que o reset diário liberou de novo uma tarefa que estava feita.
  // Usa base+8 (fora da faixa base..base+7 que cancelar() apaga), já que essa
  // notificação é avulsa e não deve ser cancelada junto com o lembrete.
  async notificarReset(tarefa: Tarefa) {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    await LocalNotifications.schedule({
      notifications: [{
        id: this.baseId(tarefa.id) + 8,
        title: '🔁 Reset diário',
        body: `${tarefa.emoji} ${tarefa.titulo} foi resetada e já pode ser feita de novo!`,
        smallIcon: 'ic_stat_name',
        channelId: 'lembretes_v2',
        sound: 'toque.mp4',
        extra: { tarefaId: tarefa.id },
        schedule: {
          at: new Date(Date.now() + 1000),
          allowWhileIdle: true
        }
      }]
    });
  }
}