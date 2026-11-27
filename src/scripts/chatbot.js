// Atendente virtual "Rê" da Gráfica Retícula (empresa fictícia).
// Classificação de intenções por palavras-chave com tolerância a erro de digitação,
// extração de entidades (produto, quantidade, medidas) e um fluxo guiado de orçamento.
// Roda 100% no navegador: sem servidor e sem chave de API.

import { produtos, acabamentos, prazos, calcular, brl, mensagemWhats, diasUteis } from './precos.js';
import { simularWhats } from './whats-sim.js';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9,.\sx]/g, ' ');

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const INTENTS = {
  saudacao: { w: { oi: 2, ola: 2, bom: 1, boa: 1, dia: .5, tarde: .5, noite: .5, eai: 2, hello: 2 } },
  orcamento: { w: { orcamento: 3, orcar: 3, preco: 3, precos: 3, quanto: 2, custa: 2, valor: 2, cotacao: 3, fazer: .5, quero: 1, pedido: 1.5, encomendar: 2, comprar: 2 } },
  prazo: { w: { prazo: 3, prazos: 3, demora: 3, quando: 1.5, fica: 1, pronto: 2, dias: 1.5, entrega: 1, urgente: 3, rapido: 2, hoje: 2, amanha: 2 } },
  arquivo: { w: { arquivo: 3, arte: 2, pdf: 3, formato: 3, sangria: 3, cmyk: 3, dpi: 3, resolucao: 3, corel: 3, illustrator: 3, canva: 3, mandar: 1, enviar: 1 } },
  criacao: { w: { criar: 2, criacao: 3, designer: 3, design: 2, logo: 2, logotipo: 3, fazem: 1, nao: .5, tenho: .5 } },
  pagamento: { w: { pagamento: 3, pagar: 3, pago: 3, paga: 3, pagto: 3, aceitam: 2, aceita: 2, forma: 1, formas: 1.5, pix: 3, credito: 3, debito: 3, boleto: 3, parcela: 3, parcelar: 3, desconto: 2, vezes: 1 } },
  entrega: { w: { entregam: 3, entregar: 3, frete: 3, motoboy: 3, retirar: 3, retirada: 3, envio: 2, correios: 3, transportadora: 3, buscar: 2 } },
  horario: { w: { horario: 3, abre: 3, fecha: 3, aberto: 3, funciona: 2, sabado: 2, domingo: 2, endereco: 3, onde: 2, fica: .5, loja: 1.5, localizacao: 3 } },
  humano: { w: { atendente: 3, humano: 3, pessoa: 3, falar: 1, alguem: 2, gente: 1, ligar: 2, telefone: 2, whatsapp: 2, zap: 2 } },
  obrigado: { w: { obrigado: 3, obrigada: 3, valeu: 3, vlw: 3, brigado: 3, show: 1, perfeito: 1.5, tchau: 3 } },
};

const PROD_WORDS = {
  cartao: ['cartao', 'cartoes', 'cartaozinho', 'visita'],
  panfleto: ['panfleto', 'panfletos', 'flyer', 'flyers', 'folheto', 'folhetos', 'filipeta'],
  adesivo: ['adesivo', 'adesivos', 'etiqueta', 'etiquetas', 'rotulo', 'rotulos'],
  banner: ['banner', 'banners', 'lona', 'faixa', 'faixas'],
};

export function classificar(texto) {
  const toks = norm(texto).split(/\s+/).filter(Boolean);
  const scores = {};
  for (const [nome, { w }] of Object.entries(INTENTS)) {
    let s = 0;
    for (const t of toks) {
      if (w[t]) { s += w[t]; continue; }
      if (t.length >= 5) for (const k of Object.keys(w)) if (k.length >= 5 && lev(t, k) === 1) { s += w[k] * .7; break; }
    }
    scores[nome] = s;
  }
  const ent = entidades(texto);
  if (ent.produto) scores.orcamento += 2.5;
  const [best, val] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  return { intent: val >= 1.5 ? best : 'desconhecido', confianca: val >= 1.5 ? Math.min(.99, val / total) : 0, scores, ent };
}

export function entidades(texto) {
  const n = norm(texto);
  const toks = n.split(/\s+/);
  let produto = null;
  for (const [p, ws] of Object.entries(PROD_WORDS)) if (toks.some((t) => ws.includes(t) || (t.length >= 6 && ws.some((w) => w.length >= 6 && lev(t, w) === 1)))) { produto = p; break; }
  let qtd = null;
  const mil = n.match(/(\d+)\s*mil\b/);
  if (mil) qtd = parseInt(mil[1], 10) * 1000;
  else { const m = n.replace(/(\d)\.(\d{3})/g, '$1$2').match(/\b(\d{2,5})\b/); if (m) qtd = parseInt(m[1], 10); }
  let medidas = null;
  const md = n.match(/(\d+(?:[.,]\d+)?)\s*(m|cm)?\s*(?:x|por)\s*(\d+(?:[.,]\d+)?)\s*(m|cm)?/);
  if (md) {
    let a = parseFloat(md[1].replace(',', '.')), b = parseFloat(md[3].replace(',', '.'));
    const cm = md[2] === 'cm' || md[4] === 'cm' || a > 10 || b > 10;
    if (cm) { a /= 100; b /= 100; }
    medidas = [a, b];
  }
  return { produto, qtd, medidas, verso: /frente e verso|4x4|dois lados|verso/.test(n) ? '4x4' : null, expresso: /urgente|expresso|24 ?h|amanha/.test(n) };
}

const R = {
  saudacao: 'Oi! Eu sou a Rê, atendente virtual da Gráfica Retícula. Faço orçamento na hora e tiro dúvidas sobre prazos, arquivos e pagamento. Como posso ajudar?',
  prazo: `O prazo normal é de ${diasUteis(prazos.normal.dias)} depois da aprovação da arte. Tem pressa? No expresso fica pronto em 24 h (acréscimo de 30%). Banners saem em até 2 dias úteis.`,
  arquivo: 'Mande o arquivo em PDF, em CMYK, com 300 dpi, 3 mm de sangria e as fontes convertidas em curvas. Aceitamos também arquivos do Canva exportados como "PDF para impressão". Antes de imprimir, conferimos tudo e mandamos uma prova digital.',
  criacao: 'Não tem a arte? A gente cria! A criação de cartão ou panfleto sai a partir de R$ 60, com até 2 ajustes inclusos. Quer já fazer um orçamento da impressão?',
  pagamento: 'Aceitamos Pix (5% de desconto), cartão de crédito em até 3x sem juros e boleto para empresas com cadastro. O pedido entra em produção assim que o pagamento é confirmado.',
  entrega: 'Você pode retirar na loja sem custo ou receber por motoboy na região (a partir de R$ 15). Para outras cidades, enviamos por transportadora.',
  horario: 'Funcionamos de segunda a sexta, das 9h às 18h, e aos sábados das 9h às 13h. (Esta é uma gráfica fictícia criada para demonstração, então não temos endereço de verdade.)',
  humano: 'Claro! Numa versão real eu passaria a conversa, com todo o histórico, para alguém da equipe no WhatsApp. Aqui na demonstração, que tal continuar comigo? Posso fazer seu orçamento agora.',
  obrigado: 'Eu que agradeço! Se precisar de mais alguma coisa, é só chamar.',
  desconhecido: 'Hum, essa eu não entendi. Posso ajudar com orçamento, prazos, arquivos, pagamento ou entrega.',
};

const SUGESTOES = ['Fazer orçamento', 'Qual o prazo?', 'Como mando o arquivo?', 'Formas de pagamento'];

export function createBot(root, { onAnalise } = {}) {
  root.innerHTML = `
    <div class="cb-log" role="log" aria-live="polite" aria-label="Conversa com a atendente virtual"></div>
    <div class="cb-chips" aria-label="Respostas rápidas"></div>
    <form class="cb-form">
      <label class="sr-only" for="cb-in-${root.id || 'x'}">Sua mensagem</label>
      <input id="cb-in-${root.id || 'x'}" class="cb-in" autocomplete="off" placeholder="Escreva sua mensagem…" maxlength="240" />
      <button class="cb-send" type="submit" aria-label="Enviar mensagem">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>
      </button>
    </form>`;
  const log = root.querySelector('.cb-log');
  const chips = root.querySelector('.cb-chips');
  const form = root.querySelector('.cb-form');
  const input = root.querySelector('.cb-in');

  let fluxo = null; // { etapa, pedido }
  let ocupado = false;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const scroll = () => { log.scrollTop = log.scrollHeight; };

  function add(quem, html) {
    const el = document.createElement('div');
    el.className = `cb-msg ${quem}`;
    el.innerHTML = quem === 'bot' ? `<span class="sr-only">Rê: </span>${html}` : `<span class="sr-only">Você: </span>${html}`;
    log.appendChild(el); scroll();
    return el;
  }
  function setChips(list) {
    chips.innerHTML = '';
    list.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cb-chip';
      const [label, valor] = Array.isArray(c) ? c : [c, c];
      b.textContent = label;
      b.addEventListener('click', () => enviar(valor, label));
      chips.appendChild(b);
    });
  }
  async function falar(html, list = null) {
    ocupado = true;
    const t = add('bot typing', '<span class="dots"><i></i><i></i><i></i></span>');
    t.setAttribute('aria-hidden', 'true');
    const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : Math.min(1400, 380 + html.length * 6);
    await new Promise((r) => setTimeout(r, delay));
    t.remove();
    add('bot', html);
    if (list) setChips(list);
    ocupado = false;
  }

  function iniciarOrcamento(ent = {}) {
    fluxo = { etapa: null, pedido: { acab: [] } };
    if (ent.produto) fluxo.pedido.produto = ent.produto;
    if (ent.qtd) fluxo.pedido.qtd = ent.qtd;
    if (ent.medidas) { fluxo.pedido.largura = ent.medidas[0]; fluxo.pedido.altura = ent.medidas[1]; }
    if (ent.verso) fluxo.pedido.verso = ent.verso;
    if (ent.expresso) fluxo.pedido.prazo = 'expresso';
    const p = fluxo.pedido, partes = [];
    if (p.produto) partes.push(p.qtd && p.produto !== 'banner' ? `${p.qtd.toLocaleString('pt-BR')} ${produtos[p.produto].plural}` : produtos[p.produto].nome.toLowerCase());
    if (p.largura) partes.push(`${String(p.largura).replace('.', ',')} x ${String(p.altura).replace('.', ',')} m`);
    if (p.verso === '4x4') partes.push('frente e verso');
    if (p.prazo === 'expresso') partes.push('expresso 24 h');
    fluxo.pref = partes.length ? `Anotei: <b>${partes.join(', ')}</b>. ` : '';
    return proximo();
  }

  function qtdMaisProxima(prod, q) {
    const l = produtos[prod].qtds;
    return l.reduce((a, b) => (Math.abs(b - q) < Math.abs(a - q) ? b : a), l[0]);
  }

  function proximo() {
    const p = fluxo.pedido;
    const pref = fluxo.pref || '';
    fluxo.pref = '';
    const falar = (html, list) => falarBase(pref + html, list);
    if (!p.produto) {
      fluxo.etapa = 'produto';
      return falar('Vamos lá! O que você quer imprimir?', Object.entries(produtos).map(([k, v]) => [v.nome, `__prod:${k}`]));
    }
    const prod = produtos[p.produto];
    if (p.produto === 'banner') {
      if (!p.largura) {
        fluxo.etapa = 'medidas';
        return falar('Qual o tamanho do banner? Pode escrever largura x altura, por exemplo <b>1 x 1,5</b> (em metros).', [['0,6 x 0,9 m', '0,6 x 0,9'], ['1 x 1,5 m', '1 x 1,5'], ['2 x 1 m', '2 x 1']]);
      }
    } else {
      if (p.qtd && !prod.qtds.includes(p.qtd)) {
        const q = qtdMaisProxima(p.produto, p.qtd);
        const aviso = `Trabalhamos com lotes fechados. O mais próximo de ${p.qtd.toLocaleString('pt-BR')} é <b>${q.toLocaleString('pt-BR')}</b>, vou usar esse.`;
        p.qtd = q;
        add('bot', aviso);
      }
      if (!p.qtd) {
        fluxo.etapa = 'qtd';
        return falar(`${prod.nome} (${prod.detalhe}). Quantas unidades?`, prod.qtds.map((q) => [q.toLocaleString('pt-BR'), `__qtd:${q}`]));
      }
      if (!p.verso && Object.keys(prod.versos).length > 1) {
        fluxo.etapa = 'verso';
        return falar('Impressão só na frente ou frente e verso?', Object.entries(prod.versos).map(([k, [n]]) => [n, `__verso:${k}`]));
      }
    }
    if (!p.acabOk) {
      fluxo.etapa = 'acab';
      const ops = prod.acab.map((a) => [acabamentos[a].nome, `__acab:${a}`]);
      return falar('Quer algum acabamento?', [...ops, ['Sem acabamento', '__acab:nenhum']]);
    }
    if (!p.prazo) {
      fluxo.etapa = 'prazo';
      return falar('E o prazo?', [[`Normal (${diasUteis(prazos.normal.dias)})`, '__prazo:normal'], ['Expresso 24 h (+30%)', '__prazo:expresso']]);
    }
    return fechar();
  }

  const falarBase = (...a) => falar(...a);

  function fechar() {
    const p = fluxo.pedido;
    const r = calcular({ produto: p.produto, qtd: p.qtd, verso: p.verso || '4x0', acab: p.acab, prazo: p.prazo, largura: p.largura, altura: p.altura });
    const linhas = r.linhas.map(([n, v]) => `<li><span>${esc(n)}</span><b>${brl(v)}</b></li>`).join('');
    const msg = mensagemWhats(p, r);
    fluxo = { etapa: 'fim', pedido: p, msg };
    onAnalise?.({ tipo: 'orcamento', pedido: p, resultado: r });
    return falar(
      `Prontinho! Seu orçamento:<ul class="cb-orc">${linhas}<li class="tot"><span>Total</span><b>${brl(r.total)}</b></li></ul>Fica pronto em ${diasUteis(r.prazo.dias)}. No Pix sai por <b>${brl(r.total * .95)}</b>.`,
      [['Enviar pedido no WhatsApp', '__whats'], ['Novo orçamento', '__novo'], ['Formas de pagamento', 'pagamento']],
    );
  }

  // atalhos usados pelos botões de sugestão
  const chipAlias = { 'Fazer orçamento': 'quero fazer um orçamento', 'Novo orçamento': '__novo' };

  async function enviar(texto, rotulo) {
    if (ocupado || !texto.trim()) return;
    if (chipAlias[texto]) { rotulo = rotulo || texto; texto = chipAlias[texto]; }
    add('user', esc(rotulo || texto));
    chips.innerHTML = '';
    input.value = '';

    // respostas dos botões do fluxo
    if (texto.startsWith('__')) {
      const [cmd, val] = texto.slice(2).split(':');
      onAnalise?.({ tipo: 'botao', cmd, val });
      if (cmd === 'novo') return iniciarOrcamento();
      if (cmd === 'whats') {
        if (fluxo?.msg) simularWhats(fluxo.msg);
        return falar('Pedido enviado para a gráfica! <small>(Simulação: a gráfica é fictícia, então nada saiu do seu navegador.)</small>', ['Novo orçamento', 'Qual o prazo?']);
      }
      if (!fluxo) fluxo = { pedido: { acab: [] } };
      const p = fluxo.pedido;
      if (cmd === 'prod') { p.produto = val; }
      if (cmd === 'qtd') p.qtd = +val;
      if (cmd === 'verso') p.verso = val;
      if (cmd === 'acab') { if (val !== 'nenhum') p.acab.push(val); p.acabOk = true; }
      if (cmd === 'prazo') p.prazo = val;
      return proximo();
    }

    const t = norm(texto);
    if (fluxo && fluxo.etapa && fluxo.etapa !== 'fim') {
      if (/\b(cancelar|cancela|parar|sair)\b/.test(t)) { fluxo = null; return falar('Tudo bem, cancelei o orçamento. Posso ajudar com outra coisa?', SUGESTOES); }
      const ent = entidades(texto);
      const p = fluxo.pedido;
      let entendeu = false;
      if (ent.produto && !p.produto) { p.produto = ent.produto; entendeu = true; }
      if (fluxo.etapa === 'qtd' && ent.qtd) { p.qtd = ent.qtd; entendeu = true; }
      if (fluxo.etapa === 'medidas' && ent.medidas) { [p.largura, p.altura] = ent.medidas; entendeu = true; }
      if (fluxo.etapa === 'verso') { p.verso = ent.verso || (/so frente|frente|um lado/.test(t) ? '4x0' : null); entendeu = !!p.verso; }
      if (fluxo.etapa === 'acab') {
        if (/\b(nao|sem|nenhum)\b/.test(t)) { p.acabOk = true; entendeu = true; }
        else for (const a of produtos[p.produto].acab) if (t.includes(norm(acabamentos[a].nome).split(' ')[0])) { p.acab.push(a); p.acabOk = true; entendeu = true; }
      }
      if (fluxo.etapa === 'prazo') { p.prazo = ent.expresso || /expresso|rapido/.test(t) ? 'expresso' : /normal|sem pressa|tanto faz/.test(t) ? 'normal' : null; entendeu = !!p.prazo; }
      onAnalise?.({ tipo: 'fluxo', etapa: fluxo.etapa, ent, entendeu });
      if (entendeu) return proximo();
      // não era resposta do fluxo: talvez seja uma dúvida no meio do orçamento
      const c = classificar(texto);
      onAnalise?.({ tipo: 'intent', ...c });
      if (c.intent !== 'desconhecido' && c.intent !== 'orcamento' && R[c.intent]) {
        await falar(R[c.intent]);
        return falar('Voltando ao orçamento:', null).then(proximo);
      }
      return falar('Não entendi essa resposta. Pode tocar numa das opções abaixo ou escrever <i>cancelar</i>.').then(() => proximo());
    }

    const c = classificar(texto);
    onAnalise?.({ tipo: 'intent', ...c });
    if (c.intent === 'orcamento') return iniciarOrcamento(c.ent);
    if (c.intent === 'criacao') return falar(R.criacao, ['Fazer orçamento', 'Como mando o arquivo?']);
    return falar(R[c.intent] || R.desconhecido, SUGESTOES);
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); enviar(input.value); });

  falar(R.saudacao, SUGESTOES);
  return { enviar: (t) => enviar(t) };
}
