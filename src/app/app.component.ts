import { Component, OnInit } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { RouterOutlet } from '@angular/router';
import { LocalNotifications } from '@capacitor/local-notifications';

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

  constructor(private platform: Platform) {}

  async ngOnInit() {
    await this.platform.ready();

    // 🔔 Permissão (Android 13+ / iOS)
    await LocalNotifications.requestPermissions();

    // 📢 Canal de notificações (OBRIGATÓRIO no Android)
    await LocalNotifications.createChannel({
      id: 'lembretes',
      name: 'Lembretes',
      importance: 5,
      vibration: true
    });
  }
}