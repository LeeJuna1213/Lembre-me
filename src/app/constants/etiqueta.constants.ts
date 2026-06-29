import { Etiqueta } from '../interfaces/tarefas.interfaces';

export const ETIQUETAS: Etiqueta[] = [
  { id: 'urgente',        emoji: '🔴', texto: 'Urgente',             cor: '#f08888' },
  { id: 'pode-esperar',   emoji: '🟡', texto: 'Pode esperar',        cor: '#fff5bf' },
  { id: 'sem-pressa',     emoji: '🟢', texto: 'Sem pressa',          cor: '#aef0ae' },
  { id: 'rapido',         emoji: '⚡', texto: 'Rápido',              cor: '#a0a6f8' },
  { id: 'requer-atencao', emoji: '🧠', texto: 'Requer atenção',      cor: '#f897f8' },
  { id: 'demorado',         emoji: '🕒', texto: 'demorado',              cor: '#fab783' },
  { id: 'antes-dormir',   emoji: '🌙', texto: 'Antes de dormir',     cor: '#a5b8dd' },
  { id: 'ao-acordar',     emoji: '☀️', texto: 'Ao acordar',          cor: '#fdf0af' },
  { id: 'precisa-comprar',emoji: '🛒', texto: 'Precisa comprar algo', cor: '#b7dff7' },
  { id: 'nao-esquecer',   emoji: '⚠️', texto: 'Não esquecer',        cor: '#e6a76d' },
  { id: 'rotina',         emoji: '🔁', texto: 'Rotina',              cor: '#dca5fc' },
  { id: 'fazer-junto',    emoji: '👥', texto: 'Fazer junto',         cor: '#99ebcd' },
];