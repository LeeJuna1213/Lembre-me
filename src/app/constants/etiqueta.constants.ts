import { Etiqueta } from '../interfaces/tarefas.interfaces';

export const ETIQUETAS: Etiqueta[] = [
  { id: 'urgente',        emoji: '🔴', texto: 'Urgente',             cor: '#f08888' },
  { id: 'pode-esperar',   emoji: '🟡', texto: 'Pode esperar',        cor: '#fff5bf' },
  { id: 'sem-pressa',     emoji: '🟢', texto: 'Sem pressa',          cor: '#aef0ae' },
  { id: 'rapido',         emoji: '⚡', texto: 'Rápido',              cor: '#a0a6f8' },
  { id: 'requer-atencao', emoji: '🧠', texto: 'Requer atenção',      cor: '#f7d8f7' },
  { id: 'demorado',         emoji: '🕒', texto: 'demorado',              cor: '#fab783' },
  { id: 'antes-dormir',   emoji: '🌙', texto: 'Antes de dormir',     cor: '#a5b8dd' },
  { id: 'ao-acordar',     emoji: '☀️', texto: 'Ao acordar',          cor: '#fdf0af' },
  { id: 'precisa-comprar',emoji: '🛒', texto: 'Precisa comprar algo', cor: '#b7dff7' },
  { id: 'nao-esquecer',   emoji: '⚠️', texto: 'Não esquecer',        cor: '#e6a76d' },
  { id: 'rotina',         emoji: '🔁', texto: 'Rotina',              cor: '#dca5fc' },
  { id: 'fazer-junto',    emoji: '👥', texto: 'Fazer junto',         cor: '#99ebcd' },
];

// Cores disponíveis para o usuário escolher ao criar uma etiqueta personalizada.
export const CORES_ETIQUETAS_PERSONALIZADAS: string[] = [
  '#f08888', '#fff5bf', '#aef0ae', '#a0a6f8', '#f7d8f7',
  '#fab783', '#a5b8dd', '#fdf0af', '#b7dff7', '#e6a76d',
];

const CHAVE_ETIQUETAS_CUSTOMIZADAS = 'etiquetas_customizadas';

export function carregarEtiquetasCustomizadas(): Etiqueta[] {
  return JSON.parse(localStorage.getItem(CHAVE_ETIQUETAS_CUSTOMIZADAS) || '[]');
}

export function salvarEtiquetasCustomizadas(etiquetas: Etiqueta[]): void {
  localStorage.setItem(CHAVE_ETIQUETAS_CUSTOMIZADAS, JSON.stringify(etiquetas));
}