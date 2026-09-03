import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Etiqueta, Tarefa } from '../interfaces/tarefas.interfaces';
import { Router } from '@angular/router';
import { NotificacoesService } from '../services/notificacoes.services';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { ETIQUETAS, carregarEtiquetasCustomizadas } from '../constants/etiqueta.constants';

@Component({
  selector: 'app-tarefas',
  templateUrl: './tarefas.page.html',
  styleUrls: ['./tarefas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class TarefasPage {

  tarefas: Tarefa[] = [];
  etiquetas: Etiqueta[] = ETIQUETAS;
  mostrarDicaArraste = false;

  // 🖐️ Controla o "segurar 0.3s antes de arrastar": o ion-reorder-group só
  // fica habilitado depois desse tempo, pra não roubar o scroll da lista
  // num toque rápido.
  reorderArmado = false;
  private readonly TEMPO_PRESSAO_MS = 300;
  private readonly TOLERANCIA_MOVIMENTO_PX = 8;
  private pressTimer: any = null;
  private pressAtivo = false;
  private pressStartX = 0;
  private pressStartY = 0;
  private pressEl: HTMLElement | null = null;
  private pressTouchId: number | null = null;


  tarefasPadrao: Tarefa[] = [
    { id: 1, titulo: 'Apagar as luzes', emoji: '💡', feito: false },
    { id: 2, titulo: 'Trancar a porta', emoji: '🚪', feito: false },
    { id: 3, titulo: 'Desligar o gás', emoji: '🎛️', feito: false }
  ];

  constructor(
    private router: Router,
    private notificacoes: NotificacoesService,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
  ) { }

  ionViewWillEnter() {
    this.carregarTarefas();
    this.etiquetas = [...ETIQUETAS, ...carregarEtiquetasCustomizadas()];
    this.exibirDicaArraste();
  }

  // Mostra, uma única vez, uma pequena animação no primeiro card para
  // indicar que as tarefas podem ser arrastadas para reordenar.
  private exibirDicaArraste() {
    if (this.tarefas.length < 2) return;
    if (localStorage.getItem('dica_arraste_vista')) return;

    setTimeout(() => {
      this.mostrarDicaArraste = true;
      setTimeout(() => {
        this.mostrarDicaArraste = false;
        localStorage.setItem('dica_arraste_vista', '1');
      }, 1200);
    }, 500);
  }

  carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');

    if (tarefasSalvas) {
      // ✅ Parse direto — preserva todos os campos, inclusive lembrete
      this.tarefas = JSON.parse(tarefasSalvas);
    } else {
      // Primeira vez: inicializa padrão e garante que proximo_id não colide
      this.tarefas = [...this.tarefasPadrao];
      if (!localStorage.getItem('proximo_id')) {
        localStorage.setItem('proximo_id', '4'); // ✅ IDs 1,2,3 já usados pelas padrão
      }
      this.salvarTarefas();
    }
  }

  salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(this.tarefas));
  }

  // ✅ trackBy evita re-renderização desnecessária que causava a duplicação visual
  trackById(index: number, tarefa: Tarefa): number {
    return tarefa.id;
  }

  reordenarTarefas(event: any) {
    const tarefaMovida = this.tarefas.splice(event.detail.from, 1)[0];
    this.tarefas.splice(event.detail.to, 0, tarefaMovida);

    event.detail.complete();

    localStorage.setItem('tarefas', JSON.stringify(this.tarefas));
  }

  // 🖐️ Início do toque/clique no card: começa a contar os 0.3s.
  // Enquanto isso, o ion-reorder-group continua desabilitado, então um
  // toque rápido (ex: rolando a lista) não é sequestrado pelo arraste.
  iniciarPressaoReorder(event: TouchEvent | MouseEvent) {
    if (this.tarefas.length < 2 || this.pressAtivo) return;

    const ponto = this.pontoDoEvento(event);
    if (!ponto) return;

    this.pressAtivo = true;
    this.pressStartX = ponto.x;
    this.pressStartY = ponto.y;
    this.pressEl = event.currentTarget as HTMLElement;
    this.pressTouchId = 'changedTouches' in event ? (event.changedTouches[0]?.identifier ?? null) : null;

    this.pressTimer = setTimeout(() => this.armarArraste(), this.TEMPO_PRESSAO_MS);
  }

  // Se o dedo se mover antes dos 0.3s, entende-se como um gesto de rolagem
  // e cancela a contagem — o card não é agarrado.
  moverPressaoReorder(event: TouchEvent | MouseEvent) {
    if (!this.pressAtivo || this.reorderArmado) return;

    const ponto = this.pontoDoEvento(event);
    if (!ponto) return;

    const dx = Math.abs(ponto.x - this.pressStartX);
    const dy = Math.abs(ponto.y - this.pressStartY);

    if (dx > this.TOLERANCIA_MOVIMENTO_PX || dy > this.TOLERANCIA_MOVIMENTO_PX) {
      this.cancelarPressaoReorder();
    }
  }

  cancelarPressaoReorder() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    this.pressAtivo = false;
    this.pressEl = null;
    this.pressTouchId = null;
  }

  // Os 0.3s se passaram com o dedo parado: habilita o ion-reorder-group e
  // repassa o toque atual pro Ionic assumir o arraste a partir daqui.
  private armarArraste() {
    const el = this.pressEl;
    const touchId = this.pressTouchId;
    if (!el) return;

    this.reorderArmado = true;

    requestAnimationFrame(() => {
      if ('ontouchstart' in window && touchId !== null) {
        const touch = new Touch({
          identifier: touchId,
          target: el,
          clientX: this.pressStartX,
          clientY: this.pressStartY
        });
        el.dispatchEvent(new TouchEvent('touchstart', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
          bubbles: true,
          cancelable: true
        }));
      } else {
        el.dispatchEvent(new MouseEvent('mousedown', {
          clientX: this.pressStartX,
          clientY: this.pressStartY,
          bubbles: true,
          cancelable: true
        }));
      }

      this.cancelarPressaoReorder();
    });
  }

  private pontoDoEvento(event: TouchEvent | MouseEvent): { x: number; y: number } | null {
    if ('changedTouches' in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      return touch ? { x: touch.clientX, y: touch.clientY } : null;
    }
    return { x: event.clientX, y: event.clientY };
  }

  acaoTarefa(tarefa: Tarefa) {
    if (!tarefa.id) {
      console.error('Tarefa sem ID:', tarefa);
      return;
    }
    if (!tarefa.feito) {
      this.router.navigate(['/fazer-tarefa', tarefa.id]);
    } else {
      this.router.navigate(['/conferir-tarefa', tarefa.id]);
    }
  }


 async abrirOpcoesNovo() {
  const actionSheet = await this.actionSheetCtrl.create({
      header: 'O que você quer criar?',
      buttons: [
        {
          text: 'Adicionar tarefa',
          icon: 'checkbox-outline',
          handler: () => this.irParaAddTarefa()
        },
        {
          text: 'Adicionar nota',
          icon: 'document-text-outline',
          handler: () => this.irParaAddNota()
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  irParaAddTarefa() {
    this.router.navigate(['/add-tarefa']);
  }

  irParaAddNota() {
    this.router.navigate(['/add-nota']);
  }

  irParaSobre() {
    this.router.navigate(['/sobre']);
  }

  async desfazerTodas() {
    const alert = await this.alertCtrl.create({
      header: '🙀 Resetar tudo?',
      message: 'Todas as tarefas e lembretes serão resetadas.',
      buttons: [
        {
          text: 'Não ❌',
          role: 'cancel',
          cssClass: 'btn-cancelar'
        },
        {
          text: 'Sim 🗑️',
          cssClass: 'btn-excluir',
          role: 'destructive',
          handler: async () => {
            await this.notificacoes.cancelarTodas();

            this.tarefas = this.tarefas.map(tarefa => ({
              ...tarefa,
              feito: false,
              lembrete: undefined,
              datetime: undefined,
              foto: undefined,
              fotoReloads: undefined
            }));

            this.salvarTarefas();
          }
        }
      ]
    });

    await alert.present();
  }

  textoLembrete(tarefa: Tarefa): string {
    const lembrete = tarefa.lembrete;
    if (!lembrete) return '';

    const hora = lembrete.hora; // "HH:mm"
    const agora = new Date();

    // cria uma data com HOJE no horário do lembrete
    const [h, m] = hora.split(':').map(Number);
    const dataLembreteHoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
      h,
      m,
      0
    );

    const jaPassouHoje = dataLembreteHoje <= agora;

    // 🗓️ Apenas hoje — é uma disparada única; se o horário já passou não há
    // próxima ocorrência (NotificacoesService não reagenda pro dia seguinte).
    if (lembrete.tipo === 'umdia') {
      return jaPassouHoje ? '' : `Hoje às ${hora}`;
    }

    // 🔁 Diário — sempre se repete, então o card deve sempre exibir o lembrete.
    if (lembrete.tipo === 'diario') {
      return jaPassouHoje ? `Amanhã às ${hora}` : `Hoje às ${hora}`;
    }

    // 📅 Semanal — o horário de hoje já ter passado não invalida os outros dias.
    if (lembrete.tipo === 'semanal') {
      const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      const dias = (lembrete.diasSemana || [])
        .map(d => nomesDias[d])
        .join(', ');

      return `Semanal: ${dias} às ${hora}`;
    }

    return '';
  }

  formatarDataFeito(datetime: string | undefined): string {
    if (!datetime) return '';

    const dataFeito = new Date(datetime); // ✅ aceita ISO e toLocaleString
    if (isNaN(dataFeito.getTime())) return `Feito em ${datetime}`;

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const diaFeito = new Date(dataFeito.getFullYear(), dataFeito.getMonth(), dataFeito.getDate());

    const diffDias = Math.round((hoje.getTime() - diaFeito.getTime()) / (1000 * 60 * 60 * 24));

    const hora = dataFeito.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (diffDias === 0) return `Feito hoje às ${hora}`;
    if (diffDias === 1) return `Feito ontem`;
    if (diffDias === 2) return `Feito anteontem`;
    if (diffDias <= 7) return `Feito há ${diffDias} dias`;

    return `Feito em ${dataFeito.toLocaleDateString('pt-BR')}`; // dd/mm/aaaa
  }


  getEtiquetas(tarefa: Tarefa): Etiqueta[] {
    if (!tarefa.etiquetas?.length) return [];
    return this.etiquetas.filter(e => tarefa.etiquetas!.includes(e.id));
  }
}