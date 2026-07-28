import { Component, OnInit } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { RouterOutlet, Router } from '@angular/router';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Tarefa } from './interfaces/tarefas.interfaces';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonicModule,
    RouterOutlet
  ]
})
export class AppComponent implements OnInit {

  constructor(private platform: Platform, private router: Router) {}

  async ngOnInit() {
    await this.platform.ready();
    // 🔔 Permissão (Android 13+ / iOS)
    await LocalNotifications.requestPermissions();

    // 📢 Canal de notificações (OBRIGATÓRIO no Android)
    // ⚠️ No Android 8+ (26+) o som do canal é travado na criação e não pode
    // ser alterado depois — por isso o id mudou para "lembretes_v2" ao
    // adicionar o som customizado, forçando a criação de um canal novo.
    await LocalNotifications.createChannel({
      id: 'lembretes_v2',
      name: 'Lembretes',
      importance: 5,
      vibration: true,
      sound: 'toque.mp4'
    });

    // ⏰ Sem permissão de alarme exato (Android 12+), o sistema pode atrasar
    // ou agrupar os lembretes, fazendo-os disparar no horário errado.
    if (this.platform.is('android')) {
      const exato = await LocalNotifications.checkExactNotificationSetting();
      if (exato.exact_alarm !== 'granted') {
        await LocalNotifications.changeExactNotificationSetting();
      }
    }

    // 👉 Ao tocar em qualquer notificação (lembrete ou reset diário), leva
    // direto pra tarefa dela — todas já carregam { tarefaId } em "extra".
    LocalNotifications.addListener('localNotificationActionPerformed', acao => {
      const tarefaId = acao.notification.extra?.tarefaId;
      if (tarefaId === undefined) return;

      this.abrirTarefaPelaNotificacao(tarefaId);
    });
  }

  private abrirTarefaPelaNotificacao(tarefaId: number) {
    const tarefas: Tarefa[] = JSON.parse(localStorage.getItem('tarefas') || '[]');
    const tarefa = tarefas.find(t => t.id === tarefaId);

    if (!tarefa) {
      this.router.navigate(['/tarefas']);
      return;
    }

    this.router.navigate([tarefa.feito ? '/conferir-tarefa' : '/fazer-tarefa', tarefaId]);
  }
}