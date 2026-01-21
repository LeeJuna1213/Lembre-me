export interface Tarefa {
  id: number;
  titulo: string;
  emoji: string;
  datetime?: string; 
  feito: boolean;   
  foto?: string;
  fotoReloads?: number;
}