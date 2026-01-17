import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-conferir-tarefa',
  templateUrl: './conferir-tarefa.page.html',
  styleUrls: ['./conferir-tarefa.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ConferirTarefaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
