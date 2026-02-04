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

    // Controle de reload da foto (proteção contra bug)
    if (this.tarefa.foto) {
      this.tarefa.fotoReloads = (this.tarefa.fotoReloads ?? 0) + 1;

      if (this.tarefa.fotoReloads > 2) {
        delete this.tarefa.foto;
        delete this.tarefa.fotoReloads;
      }

      this.salvarAtualizacao();
    }
  }

  // Tirar foto (funciona no browser e no celular)
  async tirarFoto() {
    try {
      const imagem = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (!imagem?.dataUrl) return;

      const imagemReduzida = await this.redimensionarImagem(imagem.dataUrl);

      this.tarefa.foto = imagemReduzida;
      this.tarefa.fotoReloads = 0;

      this.salvarAtualizacao();

    } catch (erro: any) {
      // Cancelamento da câmera não é erro real
      if (erro?.message?.includes('User cancelled')) {
        console.log('Usuário cancelou a câmera');
      } else {
        console.error('Erro ao tirar foto:', erro);
      }
    }
  }

  // Redimensionar + comprimir imagem (essencial para localStorage)
  private redimensionarImagem(base64: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.src = base64;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 480;

        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.4));
      };
    });
  }

  //  Concluir tarefa
  confirmarTarefa() {
    this.tarefa.feito = true;
    this.tarefa.datetime = new Date().toLocaleString();

    this.salvarAtualizacao();
    this.router.navigate(['/tarefas']);
  }

  //  Salvar alterações
  salvarAtualizacao() {
    if (!this.tarefa?.id) return;

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.map(t =>
      t.id === this.tarefa.id ? { ...this.tarefa } : t
    );

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));
  }

  //  Excluir tarefa
  excluirTarefa() {
    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.filter(t => t.id !== this.tarefa.id);

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));

    this.router.navigate(['/tarefas']);
  }

  //  Voltar
  voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }

}

