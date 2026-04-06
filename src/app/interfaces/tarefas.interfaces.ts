export interface Tarefa {
  id: number;
  titulo: string;
  emoji: string;
  datetime?: string; 
  feito: boolean;   
  foto?: string;
  fotoReloads?: number;

  lembrete?: {
    tipo: 'diario' | 'semanal' | 'mensal';
    hora: string;

    // 🔁 semanal
    diasSemana?: number[];

    // 📆 mensal (NOVO)
    diaMes?: number;
  };
}