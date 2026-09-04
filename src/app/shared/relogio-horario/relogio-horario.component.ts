import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

interface PosicaoNumero {
  valor: number;
  rotulo: string;
  x: number;
  y: number;
}

/**
 * Seletor de horário redondo (relógio analógico, no estilo do seletor
 * nativo do Android), pra não depender do wheel-picker padrão do
 * ion-datetime. Por fora sempre trabalha em formato 24h (a mesma "HH:mm"
 * usada no resto do app) — o AM/PM é só um jeito de escolher a hora,
 * igual ao relógio do Android.
 */
@Component({
  selector: 'app-relogio-horario',
  standalone: true,
  imports: [],
  templateUrl: './relogio-horario.component.html',
  styleUrls: ['./relogio-horario.component.scss'],
})
export class RelogioHorarioComponent implements OnChanges {
  @Input() valor = '12:00';
  @Output() valorChange = new EventEmitter<string>();

  @ViewChild('mostrador') private mostradorRef!: ElementRef<HTMLDivElement>;

  modo: 'hora' | 'minuto' = 'hora';
  hora24 = 12;
  minuto = 0;

  private arrastando = false;

  readonly horasPos = this.construirPosicoes([
    12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  ]);
  readonly minutosPos = this.construirPosicoes(
    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    (v) => String(v).padStart(2, '0')
  );

  ngOnChanges(changes: SimpleChanges) {
    if (changes['valor'] && this.valor) {
      const [h, m] = this.valor.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        this.hora24 = h;
        this.minuto = m;
      }
    }
  }

  get hora12(): number {
    const h = this.hora24 % 12;
    return h === 0 ? 12 : h;
  }

  get periodo(): 'AM' | 'PM' {
    return this.hora24 >= 12 ? 'PM' : 'AM';
  }

  get minutoFormatado(): string {
    return String(this.minuto).padStart(2, '0');
  }

  get anguloPonteiro(): number {
    return this.modo === 'hora' ? (this.hora12 % 12) * 30 : this.minuto * 6;
  }

  selecionarModo(modo: 'hora' | 'minuto') {
    this.modo = modo;
  }

  definirPeriodo(periodo: 'AM' | 'PM') {
    if (periodo === this.periodo) return;
    this.hora24 = periodo === 'PM' ? this.hora24 + 12 : this.hora24 - 12;
    this.emitir();
  }

  selecionarHora(h: number) {
    this.aplicarHora12(h);
    this.modo = 'minuto';
  }

  selecionarMinuto(m: number) {
    this.minuto = m;
    this.emitir();
  }

  // Permite tanto tocar num número quanto arrastar o dedo pelo mostrador,
  // igual ao relógio nativo do Android.
  iniciarArraste(event: PointerEvent) {
    this.arrastando = true;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.atualizarPorPosicao(event);
  }

  moverArraste(event: PointerEvent) {
    if (!this.arrastando) return;
    event.preventDefault();
    this.atualizarPorPosicao(event);
  }

  finalizarArraste() {
    if (!this.arrastando) return;
    this.arrastando = false;
    // Ao soltar o dedo depois de escolher a hora, avança pro minuto —
    // igual ao fluxo do relógio do Android.
    if (this.modo === 'hora') this.modo = 'minuto';
  }

  private aplicarHora12(h: number) {
    const base = h === 12 ? 0 : h;
    this.hora24 = this.periodo === 'PM' ? base + 12 : base;
    this.emitir();
  }

  private atualizarPorPosicao(event: PointerEvent) {
    const el = this.mostradorRef?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);

    // Ângulo em graus, com 0° apontando pro topo (12h) e sentido horário —
    // mesma convenção usada em construirPosicoes() e no CSS rotate().
    let anguloGraus = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (anguloGraus < 0) anguloGraus += 360;

    if (this.modo === 'hora') {
      let h = Math.round(anguloGraus / 30) % 12;
      if (h === 0) h = 12;
      this.aplicarHora12(h);
    } else {
      const m = Math.round(anguloGraus / 6) % 60;
      this.minuto = m;
      this.emitir();
    }
  }

  private emitir() {
    const hh = String(this.hora24).padStart(2, '0');
    const mm = String(this.minuto).padStart(2, '0');
    this.valorChange.emit(`${hh}:${mm}`);
  }

  private construirPosicoes(
    valores: number[],
    rotulo: (v: number) => string = (v) => String(v)
  ): PosicaoNumero[] {
    const total = valores.length;
    return valores.map((valor, i) => {
      const anguloRad = ((i * 360) / total - 90) * (Math.PI / 180);
      return {
        valor,
        rotulo: rotulo(valor),
        x: 50 + 38 * Math.cos(anguloRad),
        y: 50 + 38 * Math.sin(anguloRad),
      };
    });
  }
}
