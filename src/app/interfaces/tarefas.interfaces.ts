export interface Etiqueta {
  id: string;
  emoji: string;
  texto: string;
  cor: string; // cor de fundo do badge
}

export interface Tarefa {
  id: number;
  titulo: string;
  emoji: string;
  feito: boolean;

  etiquetas?: string[]; 
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