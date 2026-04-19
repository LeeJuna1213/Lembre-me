export interface Tarefa {
  id: number;
  titulo: string;
  emoji: string;
  feito: boolean;

  datetime?: string;
  foto?: string;
  observacao?: string;
  fotoReloads?: number;

  lembrete?: {
    tipo: 'umdia' | 'diario' | 'semanal';
    hora: string;
    diasSemana?: number[];
  };
}