// Gera src/app/emojis.ts a partir do dataset oficial da biblioteca
// emojibase-data (locale pt), no formato EmojiItem já usado pelo seletor de
// emoji do app (emoji, nome, categoria). Rodar com: npm run gerar:emojis
const fs = require('fs');
const path = require('path');

const data = require(path.join(__dirname, '..', 'node_modules', 'emojibase-data', 'pt', 'data.json'));

// Nomes de categoria mais curtos/no tom do app (o grupo 9 "flags" vem
// traduzido como "comutadores" no dataset oficial, então definimos o
// próprio texto aqui). O grupo 2 ("component") é ignorado: são só variações
// de tom de pele/cabelo soltas, sem emoji-base próprio.
const CATEGORIAS = {
  0: 'Carinhas',
  1: 'Pessoas',
  3: 'Animais e natureza',
  4: 'Comida e bebida',
  5: 'Viagens e lugares',
  6: 'Atividades',
  7: 'Objetos',
  8: 'Símbolos',
  9: 'Bandeiras',
};

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const itens = data
  .filter(e => e.group !== undefined && CATEGORIAS[e.group] !== undefined)
  .sort((a, b) => a.order - b.order)
  .map(e => ({
    emoji: e.emoji,
    nome: capitalizar(e.label),
    categoria: CATEGORIAS[e.group],
  }));

const linhas = itens
  .map(i => `  { emoji: ${JSON.stringify(i.emoji)}, nome: ${JSON.stringify(i.nome)}, categoria: ${JSON.stringify(i.categoria)} },`)
  .join('\n');

const conteudo = `// Formato de cada emoji da lista: o símbolo, um nome descritivo e a categoria a que pertence.
export interface EmojiItem {
  emoji: string;
  nome: string;
  categoria: string;
}

// Lista completa de emojis usados no seletor de emoji (tela add-tarefa),
// gerada a partir do dataset oficial da biblioteca emojibase-data (locale
// pt), agrupada pela mesma categorização usada por ela. Quem agrupa por
// categoria na tela é o método emojisDaCategoria() em add-tarefa.page.ts.
// Para atualizar: npm run gerar:emojis
export const EMOJIS: EmojiItem[] = [
${linhas}
];
`;

const destino = path.join(__dirname, '..', 'src', 'app', 'emojis.ts');
fs.writeFileSync(destino, conteudo, 'utf8');
console.log(`Gerados ${itens.length} emojis em ${destino}`);
