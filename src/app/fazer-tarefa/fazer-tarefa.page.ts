import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-fazer-tarefa',
  templateUrl: './fazer-tarefa.page.html',
  styleUrls: ['./fazer-tarefa.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class FazerTarefaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
