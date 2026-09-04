import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-add-nota',
  templateUrl: './add-nota.page.html',
  styleUrls: ['./add-nota.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, FormsModule],
})
export class AddNotaPage implements OnInit {
  constructor( private router: Router) {
  }
  ngOnInit() {}

  voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }
}
