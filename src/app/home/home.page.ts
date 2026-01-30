import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular'; // Import IonicModule


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonicModule],
})
export class HomePage {
  constructor(private router:Router) {}
  irPraTarefas(){
    this.router.navigateByUrl('tarefas')
  }
}
