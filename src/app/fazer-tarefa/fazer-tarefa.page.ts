import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Tarefa } from '../interfaces/tarefas.interfaces';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-fazer-tarefa',
  templateUrl: './fazer-tarefa.page.html',
  styleUrls: ['./fazer-tarefa.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class FazerTarefaPage implements OnInit {

  tarefa!: Tarefa;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const encontrada = tarefas.find(t => t.id === id);

    if (!encontrada) {
      this.router.navigate(['/tarefas']);
      return;
    }

    this.tarefa = { ...encontrada };

    // controle de reload da foto
    if (this.tarefa.foto) {
      this.tarefa.fotoReloads = (this.tarefa.fotoReloads ?? 0) + 1;

      if (this.tarefa.fotoReloads > 2) {
        delete this.tarefa.foto;
        delete this.tarefa.fotoReloads;
      }

      this.salvarAtualizacao();
    }
  }

  async tirarFoto() {
    const imagem = await Camera.getPhoto({
      quality: 70,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });

    this.tarefa.foto = imagem.dataUrl!;
    this.tarefa.fotoReloads = 0;

    this.salvarAtualizacao();
  }

  confirmarTarefa() {
    this.tarefa.feito = true;
    this.tarefa.datetime = new Date().toLocaleString();

    this.salvarAtualizacao();
    this.router.navigate(['/tarefas']);
  }

  salvarAtualizacao() {
    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.map(t =>
      t.id === this.tarefa.id ? { ...this.tarefa } : t
    );

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));
  }

  excluirTarefa() {
    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.filter(t => t.id !== this.tarefa.id);

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));

    this.router.navigate(['/tarefas']);
  }

  voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }
}
