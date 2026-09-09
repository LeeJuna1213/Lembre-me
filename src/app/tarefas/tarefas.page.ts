import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Etiqueta, Nota, Tarefa } from '../interfaces/tarefas.interfaces';
import { Router } from '@angular/router';
import { NotificacoesService } from '../services/notificacoes.services';
import { AlertController} from '@ionic/angular';
import { ETIQUETAS, carregarEtiquetasCustomizadas} from '../constants/etiqueta.constants';

type ItemTarefa = { tipo: 'tarefa'; dado: Tarefa };
type ItemNota = { tipo: 'nota'; dado: Nota };
type Item = ItemTarefa | ItemNota;

@Component({
  selector: 'app-tarefas',
  templateUrl: './tarefas.page.html',
  styleUrls: ['./tarefas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class TarefasPage {
  tarefas: Tarefa[] = [];
  notas: Nota[] = [];
  itens: Item[] = [];
  etiquetas: Etiqueta[] = ETIQUETAS;
  mostrarDicaArraste = false;
  mostrarOpcoesNovo = false;

  tarefasPadrao: Tarefa[] = [
    { id: 1, titulo: 'Apagar as luzes', emoji: '💡', feito: false },
    { id: 2, titulo: 'Trancar a porta', emoji: '🚪', feito: false },
    { id: 3, titulo: 'Desligar o gás', emoji: '🎛️', feito: false },
  ];

  constructor(
    private router: Router,
    private notificacoes: NotificacoesService,
    private alertCtrl: AlertController
  ) {}

  ionViewWillEnter() {
    this.carregarTarefas();
    this.carregarNotas();
    this.montarItens();
    this.etiquetas = [...ETIQUETAS, ...carregarEtiquetasCustomizadas()];
    this.exibirDicaArraste();
  }

  // Junta tarefas e notas numa única lista, respeitando a ordem combinada
  // já salva (ordemItens) e jogando itens novos (ainda não ordenados) pro final.
  montarItens() {
    const ordemSalva: { tipo: 'tarefa' | 'nota'; id: number }[] = JSON.parse(
      localStorage.getItem('ordemItens') || '[]'
    );

    const tarefasRestantes = [...this.tarefas];
    const notasRestantes = [...this.notas];
    const itens: Item[] = [];

    for (const ref of ordemSalva) {
      if (ref.tipo === 'tarefa') {
        const i = tarefasRestantes.findIndex((t) => t.id === ref.id);
        if (i !== -1) itens.push({ tipo: 'tarefa', dado: tarefasRestantes.splice(i, 1)[0] });
      } else {
        const i = notasRestantes.findIndex((n) => n.id === ref.id);
        if (i !== -1) itens.push({ tipo: 'nota', dado: notasRestantes.splice(i, 1)[0] });
      }
    }

    for (const tarefa of tarefasRestantes) itens.push({ tipo: 'tarefa', dado: tarefa });
    for (const nota of notasRestantes) itens.push({ tipo: 'nota', dado: nota });

    this.itens = itens;
  }

  // Mostra, uma única vez, uma pequena animação no primeiro card para
  // indicar que os cards podem ser arrastados para reordenar.
  private exibirDicaArraste() {
    if (this.itens.length < 2) return;
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

  carregarNotas() {
    this.notas = JSON.parse(localStorage.getItem('notas') || '[]');
  }

  abrirNota(nota: Nota) {
    this.router.navigate(['/add-nota', nota.id]);
  }

  // Prévia em texto puro do conteúdo HTML da nota, pra mostrar no card.
  //
  // Não dá pra só tirar as tags com regex: o Quill grava espaços múltiplos
  // como entidades (ex: "&nbsp;"), então sobravam pedaços tipo "&nbsp;"
  // escritos na tela. Montamos o HTML numa div e lemos o textContent, que
  // decodifica as entidades de verdade — só cuidando de trocar as tags de
  // bloco (parágrafo, quebra de linha, item de lista...) por espaço antes,
  // senão o textContent gruda o texto de linhas diferentes sem separação.
  resumoNota(nota: Nota): string {
    const comQuebras = (nota.conteudo || '').replace(
      /<\/(p|div|li|h[1-6]|blockquote)>|<br\s*\/?>/gi,
      ' '
    );

    const div = document.createElement('div');
    div.innerHTML = comQuebras;
    const texto = (div.textContent || '').replace(/\s+/g, ' ').trim();

    if (!texto) return '';
    return texto.length > 150 ? `${texto.slice(0, 150)}…` : texto;
  }

  // Data/hora de criação (ou última edição) da nota, no mesmo padrão de
  // texto usado em formatarDataFeito() para as tarefas.
  formatarDataNota(nota: Nota): string {
    const isoData = nota.atualizadoEm || nota.criadoEm;
    if (!isoData) return '';

    const data = new Date(isoData);
    if (isNaN(data.getTime())) return '';

    const agora = new Date();
    const hoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    );
    const diaData = new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    );

    const diffDias = Math.round(
      (hoje.getTime() - diaData.getTime()) / (1000 * 60 * 60 * 24)
    );

    const hora = data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const prefixo = nota.atualizadoEm ? 'Editada' : 'Escrita';

    if (diffDias === 0) return `${prefixo} hoje às ${hora}`;
    if (diffDias === 1) return `${prefixo} ontem`;
    if (diffDias === 2) return `${prefixo} anteontem`;
    if (diffDias <= 7) return `${prefixo} há ${diffDias} dias`;

    return `${prefixo} em ${data.toLocaleDateString('pt-BR')}`;
  }

  // ✅ trackBy evita re-renderização desnecessária que causava a duplicação visual
  trackByItem(index: number, item: Item): string {
    return `${item.tipo}-${item.dado.id}`;
  }

  reordenarItens(event: any) {
    const itemMovido = this.itens.splice(event.detail.from, 1)[0];
    this.itens.splice(event.detail.to, 0, itemMovido);

    event.detail.complete();

    this.salvarOrdemItens();
  }

  // Persiste a ordem combinada e mantém tarefas/notas sincronizadas com a
  // ordem relativa mostrada na tela.
  private salvarOrdemItens() {
    const ordem = this.itens.map((item) => ({ tipo: item.tipo, id: item.dado.id }));
    localStorage.setItem('ordemItens', JSON.stringify(ordem));

    this.tarefas = this.itens
      .filter((item): item is ItemTarefa => item.tipo === 'tarefa')
      .map((item) => item.dado);
    this.notas = this.itens
      .filter((item): item is ItemNota => item.tipo === 'nota')
      .map((item) => item.dado);

    this.salvarTarefas();
    localStorage.setItem('notas', JSON.stringify(this.notas));
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

  abrirOpcoesNovo() {
      this.mostrarOpcoesNovo = true;
    }

    fecharOpcoesNovo() {
      this.mostrarOpcoesNovo = false;
    }

    irParaAddTarefa() {
      this.mostrarOpcoesNovo = false;
      this.router.navigate(['/add-tarefa']);
    }

    irParaAddNota() {
      this.mostrarOpcoesNovo = false;
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
          cssClass: 'btn-cancelar',
        },
        {
          text: 'Sim 🗑️',
          cssClass: 'btn-excluir',
          role: 'destructive',
          handler: async () => {
            await this.notificacoes.cancelarTodas();

            this.tarefas = this.tarefas.map((tarefa) => ({
              ...tarefa,
              feito: false,
              lembrete: undefined,
              datetime: undefined,
              foto: undefined,
              fotoReloads: undefined,
            }));

            this.salvarTarefas();
          },
        },
      ],
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
        .map((d) => nomesDias[d])
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
    const hoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    );
    const diaFeito = new Date(
      dataFeito.getFullYear(),
      dataFeito.getMonth(),
      dataFeito.getDate()
    );

    const diffDias = Math.round(
      (hoje.getTime() - diaFeito.getTime()) / (1000 * 60 * 60 * 24)
    );

    const hora = dataFeito.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffDias === 0) return `Feito hoje às ${hora}`;
    if (diffDias === 1) return `Feito ontem`;
    if (diffDias === 2) return `Feito anteontem`;
    if (diffDias <= 7) return `Feito há ${diffDias} dias`;

    return `Feito em ${dataFeito.toLocaleDateString('pt-BR')}`; // dd/mm/aaaa
  }

  getEtiquetas(tarefa: Tarefa): Etiqueta[] {
    if (!tarefa.etiquetas?.length) return [];
    return this.etiquetas.filter((e) => tarefa.etiquetas!.includes(e.id));
  }
}
