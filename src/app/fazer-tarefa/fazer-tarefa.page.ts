import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

import { Tarefa } from '../interfaces/tarefas.interfaces';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NotificacoesService } from '../services/notificacoes.services';

@Component({
  selector: 'app-fazer-tarefa',
  templateUrl: './fazer-tarefa.page.html',
  styleUrls: ['./fazer-tarefa.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class FazerTarefaPage implements OnInit {

  tarefa!: Tarefa;

  // 🔁 Reset diário
  resetDiarioAtivo = false;
  timeoutReset: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificacoes: NotificacoesService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // 🔁 Carrega estado do reset diário
    this.resetDiarioAtivo =
      localStorage.getItem('resetDiarioAtivo') === 'true';

    this.verificarResetDiario();
    this.agendarResetDiario();

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const encontrada = tarefas.find(t => t.id === id);

    if (!encontrada) {
      this.router.navigate(['/tarefas']);
      return;
    }

    this.tarefa = { ...encontrada };

    // 📸 Controle de reload da foto
    if (this.tarefa.foto) {
      this.tarefa.fotoReloads = (this.tarefa.fotoReloads ?? 0) + 1;

      if (this.tarefa.fotoReloads > 2) {
        delete this.tarefa.foto;
        delete this.tarefa.fotoReloads;
      }

      this.salvarAtualizacao();
    }
  }

  // 📸 Tirar foto
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
      if (!erro?.message?.includes('User cancelled')) {
        console.error('Erro ao tirar foto:', erro);
      }
    }
  }

  private redimensionarImagem(base64: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 480;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.4));
      };
    });
  }

  // ✅ Confirmar tarefa
  confirmarTarefa() {
    this.tarefa.feito = true;
    this.tarefa.datetime = new Date().toISOString();
    this.salvarAtualizacao();
    this.router.navigate(['/tarefas']);
  }

  // 💾 Salvar alterações
  salvarAtualizacao() {
    if (!this.tarefa?.id) return;

    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.map(t =>
      t.id === this.tarefa.id ? { ...this.tarefa } : t
    );

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));
  }

  // 🗑️ Excluir tarefa
  async excluirTarefa() {
    const alert = await this.alertCtrl.create({
      header: '🙀 Excluir tarefa',
      message: `Tem certeza que deseja excluir a tarefa "${this.tarefa.titulo}"?`,
      buttons: [
        { text: 'Não ❌', role: 'cancel', cssClass: 'btn-cancelar' },
        {
          text: 'Sim 🗑️',
          role: 'destructive',
          cssClass: 'btn-excluir',
          handler: async () => {
            await this.notificacoes.cancelar(this.tarefa.id);

            const tarefas: Tarefa[] =
              JSON.parse(localStorage.getItem('tarefas') || '[]');

            const atualizadas = tarefas.filter(
              t => t.id !== this.tarefa.id
            );

            localStorage.setItem('tarefas', JSON.stringify(atualizadas));
            this.router.navigate(['/tarefas']);
          }
        }
      ]
    });

    await alert.present();
  }

  // 🔁 RESET DIÁRIO ============================

  verificarResetDiario() {
    if (!this.resetDiarioAtivo) return;

    const hoje = new Date().toDateString();
    const ultimoReset = localStorage.getItem('ultimoResetDiario');

    if (ultimoReset !== hoje) {
      this.resetarTarefasFeitas();
      localStorage.setItem('ultimoResetDiario', hoje);
    }
  }

  resetarTarefasFeitas() {
    const tarefas: Tarefa[] =
      JSON.parse(localStorage.getItem('tarefas') || '[]');

    const atualizadas = tarefas.map(t => ({
      ...t,
      feito: false,
      datetime: undefined
    }));

    localStorage.setItem('tarefas', JSON.stringify(atualizadas));
  }

  agendarResetDiario() {
    if (!this.resetDiarioAtivo) return;

    if (this.timeoutReset) clearTimeout(this.timeoutReset);

    const agora = new Date();
    const meiaNoite = new Date();
    meiaNoite.setHours(24, 0, 0, 0);

    const tempo = meiaNoite.getTime() - agora.getTime();

    this.timeoutReset = setTimeout(() => {
      this.resetarTarefasFeitas();
      localStorage.setItem(
        'ultimoResetDiario',
        new Date().toDateString()
      );
      this.agendarResetDiario();
    }, tempo);
  }

  toggleResetDiario() {
    this.resetDiarioAtivo = !this.resetDiarioAtivo;
    localStorage.setItem(
      'resetDiarioAtivo',
      String(this.resetDiarioAtivo)
    );

    if (this.resetDiarioAtivo) {
      this.agendarResetDiario();
    } else if (this.timeoutReset) {
      clearTimeout(this.timeoutReset);
    }
  }

  // 🔙 Navegação
  voltar() {
    this.router.navigate(['/tarefas']);
  }

  irParaLembrete() {
    this.router.navigate(
      ['/add-lembrete', this.tarefa.id],
      { queryParams: { origem: 'fazer' } }
    );
  }
}