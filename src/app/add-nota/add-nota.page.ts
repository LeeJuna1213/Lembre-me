import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Nota } from '../interfaces/tarefas.interfaces';

type ModoNota = 'criar' | 'ver' | 'editar';

@Component({
  selector: 'app-add-nota',
  templateUrl: './add-nota.page.html',
  styleUrls: ['./add-nota.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, QuillModule],
})
export class AddNotaPage implements OnInit {
  titulo = '';
  conteudo = '';

  // 'criar': nova nota | 'ver': nota existente em modo leitura | 'editar': nota existente sendo editada
  modo: ModoNota = 'criar';
  notaId: number | null = null;
  criadoEm: string | null = null;
  atualizadoEm: string | null = null;

  mostrarOpcoesImagem = false;

  readonly limiteCaracteres = 1000;
  readonly limiteImagens = 2;
  contadorConteudo = 0;

  private quillEditorRef: any;

  readonly quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'link', 'image'],
        ['clean'],
      ],
      handlers: {
        // 🖼️ Sobrescreve o handler padrão (que abriria um file-picker cru)
        // pra usar nosso próprio menu com opção de câmera e galeria.
        //
        // Os cliques na toolbar do Quill acontecem fora da zone do Angular,
        // então mudanças de estado feitas direto (ex: mostrarOpcoesImagem =
        // true) não disparam change detection e a UI não atualiza — por
        // isso todo handler entra explicitamente na zone com ngZone.run().
        image: () => this.ngZone.run(() => this.abrirOpcoesImagem()),
        // 🔗 O handler padrão do Quill usa window.prompt(), que não funciona
        // dentro da webview do Capacitor no Android — trocamos por um alert.
        link: (valor: any) => this.ngZone.run(() => this.aplicarLink(valor)),
        // 🧹 Reimplementado com nossa própria referência do editor, pra não
        // depender de nenhum merge interno de handlers do Quill.
        clean: () => this.ngZone.run(() => this.limparFormatacao()),
      },
    },
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);
      const nota = this.carregarNotas().find((n) => n.id === id);

      if (nota) {
        this.notaId = nota.id;
        this.titulo = nota.titulo;
        this.conteudo = nota.conteudo;
        this.criadoEm = nota.criadoEm;
        this.atualizadoEm = nota.atualizadoEm ?? null;
        this.modo = 'ver';
        this.solicitarPermissoesCamera();
        return;
      }
    }

    this.notaId = null;
    this.titulo = '';
    this.conteudo = '';
    this.criadoEm = null;
    this.atualizadoEm = null;
    this.modo = 'criar';
    this.solicitarPermissoesCamera();
  }

  // Mesmo padrão de texto usado em TarefasPage.formatarDataNota().
  get dataFormatada(): string {
    const isoData = this.atualizadoEm || this.criadoEm;
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

    const prefixo = this.atualizadoEm ? 'Editada' : 'Escrita';

    if (diffDias === 0) return `${prefixo} hoje às ${hora}`;
    if (diffDias === 1) return `${prefixo} ontem`;
    if (diffDias === 2) return `${prefixo} anteontem`;
    if (diffDias <= 7) return `${prefixo} há ${diffDias} dias`;

    return `${prefixo} em ${data.toLocaleDateString('pt-BR')}`;
  }

  // 📸 Pede a permissão de câmera/galeria assim que a página abre, não só na
  // hora de tirar a foto — se o diálogo do sistema aparecer no meio da
  // primeira chamada ao Camera.getPhoto, a promise às vezes nunca resolve
  // dentro da webview do Capacitor, e o botão parece simplesmente não fazer
  // nada até a página ser reaberta (quando a permissão já está concedida).
  private async solicitarPermissoesCamera() {
    try {
      await Camera.requestPermissions();
    } catch {
      // Se isso falhar, o Camera.getPhoto ainda tenta pedir de novo na hora.
    }
  }

  get emojiCabecalho(): string {
    return this.modo === 'ver' ? '📖' : '✏️';
  }

  get tituloCabecalho(): string {
    if (this.modo === 'editar') return 'Editar nota';
    if (this.modo === 'ver') return 'Ver nota';
    return 'Adicionar nota';
  }

  onEditorCreated(editor: any) {
    this.quillEditorRef = editor;
    this.atualizarContadorConteudo(editor);
  }

  // 📏 Corta o texto de volta pro limite quando o usuário ultrapassa —
  // getText() sempre devolve um '\n' final que o Quill força em todo
  // documento, por isso ele é descontado da contagem exibida.
  //
  // Assim como os handlers da toolbar, o 'text-change' do Quill é emitido
  // pelo Emitter interno dele (não um evento de DOM), então o zone.js não
  // intercepta — sem ngZone.run() o contador atualiza o valor mas a tela
  // não re-renderiza.
  onConteudoAlterado(event: any) {
    this.ngZone.run(() => {
      const editor: any = event.editor;
      const texto: string = event.text ?? editor.getText();
      const tamanho = texto.length - 1;

      if (tamanho > this.limiteCaracteres) {
        editor.deleteText(this.limiteCaracteres, tamanho - this.limiteCaracteres, 'user');
        this.contadorConteudo = this.limiteCaracteres;
        return;
      }

      this.contadorConteudo = Math.max(tamanho, 0);
    });
  }

  private atualizarContadorConteudo(editor: any) {
    this.contadorConteudo = Math.max(editor.getText().length - 1, 0);
  }

  editarNota() {
    this.modo = 'editar';
  }

  private carregarNotas(): Nota[] {
    return JSON.parse(localStorage.getItem('notas') || '[]');
  }

  private salvarNotas(notas: Nota[]) {
    localStorage.setItem('notas', JSON.stringify(notas));
  }

  async salvarNota() {
    const tituloLimpo = this.titulo.trim();

    if (!tituloLimpo) {
      const alert = await this.alertCtrl.create({
        header: '🙀 Faltou o título',
        message: 'Escreva um título para a nota antes de continuar.',
        buttons: [{ text: 'Ok 👍', cssClass: 'btn-cancelar' }],
      });
      await alert.present();
      return;
    }

    const notas = this.carregarNotas();

    if (this.notaId !== null) {
      const atualizadas = notas.map((n) =>
        n.id === this.notaId
          ? {
              ...n,
              titulo: tituloLimpo,
              conteudo: this.conteudo,
              atualizadoEm: new Date().toISOString(),
            }
          : n
      );
      this.salvarNotas(atualizadas);
    } else {
      const proximoId = Number(localStorage.getItem('proximo_id_nota') ?? '1');
      localStorage.setItem('proximo_id_nota', String(proximoId + 1));

      const novaNota: Nota = {
        id: proximoId,
        titulo: tituloLimpo,
        conteudo: this.conteudo,
        criadoEm: new Date().toISOString(),
      };

      notas.push(novaNota);
      this.salvarNotas(notas);
    }

    this.router.navigate(['/tarefas']);
  }

  voltarTarefas() {
    this.router.navigate(['/tarefas']);
  }

  async excluirNota() {
    if (this.notaId === null) return;

    const alert = await this.alertCtrl.create({
      header: '🙀 Excluir nota',
      message: `Tem certeza que deseja excluir a nota "${this.titulo}"?`,
      buttons: [
        { text: 'Não ❌', role: 'cancel', cssClass: 'btn-cancelar' },
        {
          text: 'Sim 🗑️',
          role: 'destructive',
          cssClass: 'btn-excluir',
          handler: () => {
            const notas = this.carregarNotas().filter(
              (n) => n.id !== this.notaId
            );
            this.salvarNotas(notas);
            this.router.navigate(['/tarefas']);
          },
        },
      ],
    });

    await alert.present();
  }

  // 🔗 value === true: usuário selecionou texto e clicou pra virar link.
  // value === false: clicou num link já existente (o Quill entende isso
  // como "desligar" o formato).
  private aplicarLink(valor: any) {
    if (!this.quillEditorRef) return;

    const range = this.quillEditorRef.getSelection(true);

    if (valor === false) {
      if (range) this.quillEditorRef.format('link', false, 'user');
      return;
    }

    if (!range || range.length === 0) {
      this.avisar(
        '🙀 Selecione um texto',
        'Selecione o trecho que vai virar link antes de clicar no botão.'
      );
      return;
    }

    this.pedirUrl(range);
  }

  private async pedirUrl(range: { index: number; length: number }) {
    const alert = await this.alertCtrl.create({
      header: '🔗 Inserir link',
      inputs: [{ name: 'url', type: 'url', placeholder: 'https://exemplo.com' }],
      buttons: [
        { text: 'Cancelar ❌', role: 'cancel', cssClass: 'btn-cancelar' },
        {
          text: 'Aplicar 🔗',
          handler: (dados) => {
            const url = (dados?.url || '').trim();
            if (!url || !this.quillEditorRef) return;
            this.quillEditorRef.formatText(
              range.index,
              range.length,
              'link',
              url,
              'user'
            );
          },
        },
      ],
    });

    await alert.present();
  }

  private limparFormatacao() {
    if (!this.quillEditorRef) return;

    const range = this.quillEditorRef.getSelection(true);
    if (!range) return;

    if (range.length === 0) {
      const formatosAtuais = this.quillEditorRef.getFormat(range);
      Object.keys(formatosAtuais).forEach((nome) =>
        this.quillEditorRef.format(nome, false, 'user')
      );
    } else {
      this.quillEditorRef.removeFormat(range.index, range.length, 'user');
    }
  }

  private async avisar(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [{ text: 'Ok 👍', cssClass: 'btn-cancelar' }],
    });
    await alert.present();
  }

  // 🖼️ Menu de escolha: tirar foto ou pegar da galeria — bloqueado ao
  // atingir o limite de imagens por nota.
  abrirOpcoesImagem() {
    const totalImagens = this.quillEditorRef?.root.querySelectorAll('img').length ?? 0;

    if (totalImagens >= this.limiteImagens) {
      this.avisar(
        '🙀 Limite de imagens',
        `Cada nota pode ter no máximo ${this.limiteImagens} imagens.`
      );
      return;
    }

    this.mostrarOpcoesImagem = true;
  }

  fecharOpcoesImagem() {
    this.mostrarOpcoesImagem = false;
  }

  async inserirImagem(origem: 'camera' | 'galeria') {
    this.mostrarOpcoesImagem = false;

    try {
      const imagem = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: origem === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      });

      if (!imagem?.dataUrl || !this.quillEditorRef) return;

      const imagemReduzida = await this.redimensionarImagem(imagem.dataUrl);

      const range = this.quillEditorRef.getSelection(true);
      const index = range ? range.index : this.quillEditorRef.getLength();

      this.quillEditorRef.insertEmbed(index, 'image', imagemReduzida, 'user');
      this.quillEditorRef.setSelection(index + 1, 0);
    } catch (erro: any) {
      if (!erro?.message?.includes('User cancelled')) {
        console.error('Erro ao inserir imagem:', erro);
      }
    }
  }

  // 📉 Reduz a imagem antes de embutir como base64, senão o conteúdo da
  // nota (guardado inteiro no localStorage) explode de tamanho rapidinho.
  private redimensionarImagem(base64: string): Promise<string> {
    return new Promise((resolve) => {
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
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  }
}
