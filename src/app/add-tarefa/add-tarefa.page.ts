import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Etiqueta, Tarefa } from '../interfaces/tarefas.interfaces';
import {
  ETIQUETAS,
  CORES_ETIQUETAS_PERSONALIZADAS,
  carregarEtiquetasCustomizadas,
  salvarEtiquetasCustomizadas
} from '../constants/etiqueta.constants';
import { EMOJIS, EmojiItem } from '../emojis';
@Component({
  selector: 'app-add-tarefa',
  templateUrl: './add-tarefa.page.html',
  styleUrls: ['./add-tarefa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AddTarefaPage {

  titulo: string = '';
  emoji: string = '';
  etiquetasSelecionadas: string[] = [];

  readonly etiquetas = ETIQUETAS;
  readonly coresDisponiveis = CORES_ETIQUETAS_PERSONALIZADAS;

  etiquetasCustomizadas: Etiqueta[] = [];
  mostrarNovaEtiqueta = false;
  novaEtiquetaTexto = '';
  novaEtiquetaEmoji = '';
  novaEtiquetaCor = CORES_ETIQUETAS_PERSONALIZADAS[0];
  mostrarEmojisEtiqueta = false;

  private pressTimer: any = null;
  private pressandoLongo = false;

  // Lista completa de emojis disponíveis (vem de src/app/emojis.ts).
  // Cada item tem { emoji, nome, categoria }.
  emojis: EmojiItem[] = EMOJIS;

  private readonly CHAVE_EMOJIS_RECENTES = 'emojis_recentes';
  private readonly MAX_EMOJIS_RECENTES = 24;
  private readonly NOME_CATEGORIA_RECENTES = 'Recentes';

  // Últimos emojis escolhidos (em qualquer um dos dois seletores), do mais
  // recente pro mais antigo. Persistido pra sobreviver ao fechar o app.
  emojisRecentes: string[] = this.carregarEmojisRecentes();

  // Categoria em destaque (círculo verde) em cada um dos dois seletores.
  categoriaAtivaTarefa: string | null = null;
  categoriaAtivaEtiqueta: string | null = null;

  private carregarEmojisRecentes(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this.CHAVE_EMOJIS_RECENTES) || '[]');
    } catch {
      return [];
    }
  }

  private registrarEmojiRecente(emoji: string) {
    this.emojisRecentes = [emoji, ...this.emojisRecentes.filter(e => e !== emoji)]
      .slice(0, this.MAX_EMOJIS_RECENTES);
    localStorage.setItem(this.CHAVE_EMOJIS_RECENTES, JSON.stringify(this.emojisRecentes));
  }

  // Controla se o painel de seleção de emoji está aberto ou fechado.
  mostrarEmojis = false;
  // Abre o painel de emojis (chamado ao clicar em "Escolher emoji").
  abrirEmojis() {
    this.mostrarEmojis = true;
    this.categoriaAtivaTarefa = this.categorias[0];
  }

  // Fecha o painel de emojis (botão "Fechar" ou após escolher um emoji).
  fecharEmojis() {
    this.mostrarEmojis = false;
  }

  // Define o emoji escolhido pelo usuário no campo da tarefa e fecha o painel.
  selecionarEmoji(emoji: string) {
    this.emoji = emoji;
    this.registrarEmojiRecente(emoji);
    this.mostrarEmojis = false;
  }

  // Retorna apenas os emojis que pertencem a uma categoria específica.
  // Usado no HTML para desenhar cada bloco de categoria com seus emojis.
  // "Recentes" é montada na hora a partir do histórico, não vem de emojis.ts.
  emojisDaCategoria(categoria: string): EmojiItem[] {
    if (categoria === this.NOME_CATEGORIA_RECENTES) {
      return this.emojisRecentes
        .map(emoji => this.emojis.find(e => e.emoji === emoji))
        .filter((e): e is EmojiItem => !!e);
    }
    return this.emojis.filter(e => e.categoria === categoria);
  }

  // Lista das categorias sem repetição (ex: ['Casa', 'Cozinha', 'Compras', ...]),
  // extraída a partir de todos os emojis. O Set remove os nomes duplicados
  // e o spread [...] transforma o Set de volta em um array normal.
  // "Recentes" entra na frente só quando já existe algum emoji usado.
  private readonly categoriasBase = [...new Set(EMOJIS.map(e => e.categoria))];

  get categorias(): string[] {
    return this.emojisRecentes.length
      ? [this.NOME_CATEGORIA_RECENTES, ...this.categoriasBase]
      : this.categoriasBase;
  }

  // Emoji que representa cada categoria na barra de atalhos do seletor.
  private readonly ICONES_CATEGORIA: Record<string, string> = {
    'Recentes': '🕘',
    'Carinhas': '😀',
    'Pessoas': '👋',
    'Animais e natureza': '🐱',
    'Comida e bebida': '🍎',
    'Viagens e lugares': '🏠',
    'Atividades': '⚽',
    'Objetos': '📝',
    'Símbolos': '⛔',
    'Bandeiras': '🏁',
  };

  iconeCategoria(categoria: string): string {
    return this.ICONES_CATEGORIA[categoria] ?? '🔸';
  }

  // Gera um id de DOM único para o bloco de uma categoria. O prefixo
  // distingue o painel da tarefa do painel da etiqueta, já que os dois
  // podem estar montados na página ao mesmo tempo.
  idCategoria(prefixo: string, categoria: string): string {
    return `emoji-cat-${prefixo}-${categoria.replace(/\s+/g, '-')}`;
  }

  // Rola o painel até o bloco da categoria clicada. O respiro pra não ficar
  // escondido atrás do cabeçalho fixo (Fechar + barra de categorias) é feito
  // via "scroll-margin-top" no CSS do .categoria-bloco, não aqui — assim o
  // navegador sempre calcula em cima do layout já renderizado (com ~1900
  // emojis na lista, medir a posição na mão ficava impreciso).
  // Pulo instantâneo (não "smooth"): com ~1900 emojis, uma categoria distante
  // fica a milhares de pixels e uma rolagem animada levaria segundos.
  private scrollarParaCategoria(targetId: string) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  irParaCategoria(categoria: string) {
    this.categoriaAtivaTarefa = categoria;
    this.scrollarParaCategoria(this.idCategoria('tarefa', categoria));
  }

  irParaCategoriaEtiqueta(categoria: string) {
    this.categoriaAtivaEtiqueta = categoria;
    this.scrollarParaCategoria(this.idCategoria('etiqueta', categoria));
  }

constructor(
  private router: Router,
  private alertCtrl: AlertController
) { }

ionViewWillEnter() {
  this.etiquetasCustomizadas = carregarEtiquetasCustomizadas();
}

toggleEtiqueta(id: string) {
  // Ignora o clique que vem logo depois de um "apertar e segurar" (long press).
  if (this.pressandoLongo) {
    this.pressandoLongo = false;
    return;
  }

  const index = this.etiquetasSelecionadas.indexOf(id);
  if (index === -1) {
    this.etiquetasSelecionadas.push(id);
  } else {
    this.etiquetasSelecionadas.splice(index, 1);
  }
}

etiquetaSelecionada(id: string): boolean {
  return this.etiquetasSelecionadas.includes(id);
}

etiquetaCustomizada(id: string): boolean {
  return id.startsWith('custom-');
}

abrirNovaEtiqueta() {
  this.novaEtiquetaTexto = '';
  this.novaEtiquetaEmoji = '';
  this.novaEtiquetaCor = this.coresDisponiveis[0];
  this.mostrarEmojisEtiqueta = false;
  this.mostrarNovaEtiqueta = true;
}

fecharNovaEtiqueta() {
  this.mostrarNovaEtiqueta = false;
  this.mostrarEmojisEtiqueta = false;
}

selecionarCor(cor: string) {
  this.novaEtiquetaCor = cor;
}

abrirEmojisEtiqueta() {
  this.mostrarEmojisEtiqueta = true;
  this.categoriaAtivaEtiqueta = this.categorias[0];
}

fecharEmojisEtiqueta() {
  this.mostrarEmojisEtiqueta = false;
}

selecionarEmojiEtiqueta(emoji: string) {
  this.novaEtiquetaEmoji = emoji;
  this.registrarEmojiRecente(emoji);
  this.mostrarEmojisEtiqueta = false;
}

async adicionarEtiquetaCustomizada() {
  const texto = this.novaEtiquetaTexto.trim();
  if (!texto) {
    const alert = await this.alertCtrl.create({
      header: '🙀 Faltou o nome',
      message: 'Escreva um nome para a etiqueta antes de salvar.',
      buttons: [{ text: 'Ok 👍', cssClass: 'btn-cancelar' }]
    });
    await alert.present();
    return;
  }

  const novaEtiqueta: Etiqueta = {
    id: `custom-${Date.now()}`,
    emoji: this.novaEtiquetaEmoji.trim() || '🏷️',
    texto,
    cor: this.novaEtiquetaCor
  };

  this.etiquetasCustomizadas.push(novaEtiqueta);
  salvarEtiquetasCustomizadas(this.etiquetasCustomizadas);

  this.mostrarNovaEtiqueta = false;
}

iniciarPressao(etiqueta: Etiqueta) {
  if (!this.etiquetaCustomizada(etiqueta.id)) return;

  this.pressandoLongo = false;
  this.pressTimer = setTimeout(() => {
    this.pressandoLongo = true;
    this.confirmarExcluirEtiqueta(etiqueta);
  }, 600);
}

cancelarPressao() {
  if (this.pressTimer) {
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }
}

async confirmarExcluirEtiqueta(etiqueta: Etiqueta) {
  const alert = await this.alertCtrl.create({
    header: '🙀 Apagar etiqueta',
    message: `Deseja apagar a etiqueta "${etiqueta.texto}"?`,
    buttons: [
      { text: 'Não ❌', role: 'cancel', cssClass: 'btn-cancelar' },
      {
        text: 'Sim 🗑️',
        role: 'destructive',
        cssClass: 'btn-excluir',
        handler: () => {
          this.etiquetasCustomizadas = this.etiquetasCustomizadas.filter(e => e.id !== etiqueta.id);
          salvarEtiquetasCustomizadas(this.etiquetasCustomizadas);

          const index = this.etiquetasSelecionadas.indexOf(etiqueta.id);
          if (index !== -1) this.etiquetasSelecionadas.splice(index, 1);
        }
      }
    ]
  });

  await alert.present();
}

  async adicionarTarefa() {
  const semTitulo = !this.titulo.trim();
  const semEmoji = !this.emoji.trim();

  if (semTitulo || semEmoji) {
    const mensagem = semTitulo && semEmoji
      ? 'Preencha o título da tarefa e escolha um emoji antes de continuar.'
      : semTitulo
        ? 'Preencha o título da tarefa antes de continuar.'
        : 'Escolha um emoji antes de continuar.';

    const alert = await this.alertCtrl.create({
      header: '🙀 Faltou algo',
      message: mensagem,
      buttons: [{ text: 'Ok 👍', cssClass: 'btn-cancelar' }]
    });
    await alert.present();
    return;
  }

  const tarefas: Tarefa[] =
    JSON.parse(localStorage.getItem('tarefas') || '[]');

  const proximoId = Number(localStorage.getItem('proximo_id') ?? '4');
  localStorage.setItem('proximo_id', String(proximoId + 1));

  const novaTarefa: Tarefa = {
    id: proximoId,
    titulo: this.titulo.trim(),
    emoji: this.emoji.trim(),
    feito: false,
    ...(this.etiquetasSelecionadas.length && { etiquetas: [...this.etiquetasSelecionadas] })
  };

  tarefas.push(novaTarefa);
  localStorage.setItem('tarefas', JSON.stringify(tarefas));

  this.titulo = '';
  this.emoji = '';
  this.etiquetasSelecionadas = [];

  this.router.navigate(['/tarefas']);
}

voltarTarefas() {
  this.router.navigate(['/tarefas']);
}
}