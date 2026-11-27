// Tabela de preços da gráfica fictícia "Gráfica Retícula".
// Usada pela calculadora da landing page e pelo chatbot (uma única fonte de verdade).

export const produtos = {
  cartao: {
    nome: 'Cartão de visita', plural: 'cartões de visita', detalhe: '9 x 5 cm · couché 300 g',
    unidade: 'un', qtds: [100, 250, 500, 1000, 2000],
    // preço do lote por quantidade (frente colorida)
    tabela: { 100: 49, 250: 79, 500: 119, 1000: 189, 2000: 329 },
    versos: { '4x0': ['Só frente', 1], '4x4': ['Frente e verso', 1.35] },
    acab: ['laminacao', 'verniz', 'cantos'],
  },
  panfleto: {
    nome: 'Panfleto', plural: 'panfletos', detalhe: 'A5 · couché 115 g',
    unidade: 'un', qtds: [500, 1000, 2500, 5000, 10000],
    tabela: { 500: 129, 1000: 189, 2500: 359, 5000: 589, 10000: 989 },
    versos: { '4x0': ['Só frente', 1], '4x4': ['Frente e verso', 1.3] },
    acab: ['verniz'],
  },
  adesivo: {
    nome: 'Adesivo redondo', plural: 'adesivos redondos', detalhe: '5 cm · vinil brilho',
    unidade: 'un', qtds: [50, 100, 250, 500, 1000],
    tabela: { 50: 39, 100: 65, 250: 129, 500: 219, 1000: 379 },
    versos: { '4x0': ['Impressão colorida', 1] },
    acab: ['laminacao'],
  },
  banner: {
    nome: 'Banner em lona', detalhe: 'lona 440 g · impressão digital',
    unidade: 'm²', porM2: 69, minimo: 45,
    acab: ['bastao', 'ilhos'],
  },
};

export const acabamentos = {
  laminacao: { nome: 'Laminação fosca', tipo: 'pct', v: 0.18 },
  verniz: { nome: 'Verniz localizado', tipo: 'pct', v: 0.28 },
  cantos: { nome: 'Cantos arredondados', tipo: 'pct', v: 0.1 },
  bastao: { nome: 'Bastão e cordão', tipo: 'fixo', v: 18 },
  ilhos: { nome: 'Ilhós nos cantos', tipo: 'fixo', v: 12 },
};

export const prazos = {
  normal: { nome: 'Normal', dias: 3, mult: 1 },
  expresso: { nome: 'Expresso 24 h', dias: 1, mult: 1.3 },
};

export const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Calcula o orçamento. Retorna { total, unit, prazo, linhas[] }. */
export function calcular({ produto, qtd, verso = '4x0', acab = [], prazo = 'normal', largura = 1, altura = 1 }) {
  const p = produtos[produto];
  if (!p) throw new Error('Produto inválido');
  const linhas = [];
  let base;
  if (produto === 'banner') {
    const area = Math.max(0.25, largura * altura);
    base = Math.max(p.minimo, area * p.porM2);
    linhas.push([`${p.nome} ${largura.toFixed(2).replace('.', ',')} x ${altura.toFixed(2).replace('.', ',')} m`, base]);
    qtd = 1;
  } else {
    base = p.tabela[qtd];
    if (base == null) throw new Error('Quantidade inválida');
    const vm = (p.versos[verso] || p.versos['4x0'])[1];
    base = base * vm;
    linhas.push([`${qtd.toLocaleString('pt-BR')} ${p.plural} · ${(p.versos[verso] || p.versos['4x0'])[0].toLowerCase()}`, base]);
  }
  let total = base;
  for (const a of acab) {
    const ac = acabamentos[a];
    if (!ac || !p.acab.includes(a)) continue;
    const v = ac.tipo === 'pct' ? base * ac.v : ac.v;
    linhas.push([ac.nome, v]);
    total += v;
  }
  const pz = prazos[prazo] || prazos.normal;
  if (pz.mult !== 1) { const v = total * (pz.mult - 1); linhas.push([pz.nome, v]); total += v; }
  total = Math.round(total * 100) / 100;
  return { total, unit: produto === 'banner' ? total : total / qtd, prazo: pz, linhas };
}

export function mensagemWhats(pedido, r) {
  const p = produtos[pedido.produto];
  const itens = r.linhas.map(([n, v]) => `• ${n}: ${brl(v)}`).join('\n');
  return `Olá, Gráfica Retícula! Quero fazer este pedido:\n\n${p.nome} (${p.detalhe})\n${itens}\n\nTotal: ${brl(r.total)}\nPrazo: ${r.prazo.nome} (${diasUteis(r.prazo.dias)})`;
}

export const diasUteis = (n) => (n > 1 ? `${n} dias úteis` : `${n} dia útil`);
