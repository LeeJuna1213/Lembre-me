import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { LocalNotifications } from '@capacitor/local-notifications';

defineCustomElements(window);

  bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular(),
      provideRouter(routes, withPreloading(PreloadAllModules)),
      importProvidersFrom(IonicModule.forRoot()),
    ],
  }).then(() => {
    pedirPermissao();
  });

  async function pedirPermissao() {
    await LocalNotifications.requestPermissions();
  }