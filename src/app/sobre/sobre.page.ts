import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sobre',
  templateUrl: './sobre.page.html',
  styleUrls: ['./sobre.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SobrePage {

  readonly versaoApp = '1.0';
  readonly ferramentas = ['Ionic', 'Angular', 'Capacitor', 'TypeScript'];

  constructor(private router: Router) {}

  voltar() {
    this.router.navigate(['/tarefas']);
  }
}
