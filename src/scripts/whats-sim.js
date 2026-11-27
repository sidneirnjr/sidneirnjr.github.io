// Simula o envio do pedido pelo WhatsApp dentro da demo.
// Nada sai do navegador: a gráfica é fictícia, então mostramos como seria a conversa.

const CSS = `
.ws-ov{position:fixed;inset:0;z-index:100;background:#0008;backdrop-filter:blur(3px);display:grid;place-items:center;padding:16px;animation:ws-f .25s ease}
@keyframes ws-f{from{opacity:0}}
.ws{width:min(400px,100%);height:min(620px,calc(100dvh - 32px));background:#0b141a;color:#e9edef;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;font:15px/1.45 Inter,system-ui,sans-serif;box-shadow:0 30px 80px -20px #000;animation:ws-p .35s cubic-bezier(.2,.8,.2,1)}
@keyframes ws-p{from{transform:translateY(20px) scale(.97);opacity:0}}
.ws-h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#202c33}
.ws-h .av{width:38px;height:38px;border-radius:50%;background:#ffcc00;color:#111;display:grid;place-items:center;font-weight:700}
.ws-h div{flex:1;display:grid;line-height:1.25}.ws-h small{color:#8696a0;font-size:12px}
.ws-x{background:none;border:0;color:#e9edef;font-size:26px;width:36px;height:36px;border-radius:50%;cursor:pointer}.ws-x:hover{background:#ffffff1a}
.ws-b{flex:1;overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:8px;background-image:radial-gradient(#ffffff07 1px,transparent 1px);background-size:18px 18px}
.ws-m{max-width:85%;padding:8px 10px 6px;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;animation:ws-p .3s cubic-bezier(.2,.8,.2,1)}
.ws-m.eu{align-self:flex-end;background:#005c4b;border-top-right-radius:2px}
.ws-m.ela{align-self:flex-start;background:#202c33;border-top-left-radius:2px}
.ws-t{display:block;text-align:right;font-size:11px;color:#ffffff99;margin-top:2px}
.ws-t i{font-style:normal;margin-left:4px;color:#ffffff99;transition:color .3s}.ws-t i.lido{color:#53bdeb}
.ws-n{align-self:center;background:#182229;color:#8696a0;font-size:12.5px;padding:6px 12px;border-radius:8px;text-align:center;max-width:90%}
.ws-d{display:inline-flex;gap:4px}.ws-d b{width:6px;height:6px;border-radius:50%;background:#8696a0;animation:ws-dot 1s infinite}.ws-d b:nth-child(2){animation-delay:.15s}.ws-d b:nth-child(3){animation-delay:.3s}
@keyframes ws-dot{40%{transform:translateY(-3px);opacity:1}}
.ws-f{padding:10px 12px;background:#202c33;text-align:center;font-size:12.5px;color:#8696a0}
@media (prefers-reduced-motion:reduce){.ws-ov,.ws,.ws-m{animation:none}}
`;

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function simularWhats(mensagem) {
  if (!document.getElementById('ws-css')) {
    const st = document.createElement('style'); st.id = 'ws-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  const anterior = document.activeElement;
  const ov = document.createElement('div');
  ov.className = 'ws-ov';
  ov.innerHTML = `
    <div class="ws" role="dialog" aria-modal="true" aria-label="Simulação de conversa no WhatsApp">
      <div class="ws-h"><span class="av" aria-hidden="true">GR</span><div><b>Gráfica Retícula</b><small data-st>online</small></div>
        <button class="ws-x" type="button" aria-label="Fechar simulação">×</button></div>
      <div class="ws-b" role="log" aria-live="polite">
        <p class="ws-n">Simulação: a gráfica é fictícia, nenhuma mensagem foi enviada de verdade.</p>
        <div class="ws-m eu">${esc(mensagem)}<span class="ws-t">${hora()}<i data-tick aria-label="enviada">✓</i></span></div>
      </div>
      <div class="ws-f">Num site real, este botão abre o WhatsApp da gráfica com a mensagem pronta.</div>
    </div>`;
  document.body.appendChild(ov);
  const corpo = ov.querySelector('.ws-b');
  const st = ov.querySelector('[data-st]');
  const tick = ov.querySelector('[data-tick]');
  const timers = [];
  const depois = (ms, fn) => timers.push(setTimeout(fn, ms));
  const fechar = () => { timers.forEach(clearTimeout); ov.remove(); document.removeEventListener('keydown', onKey); anterior?.focus?.(); };
  const onKey = (e) => { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', (e) => { if (e.target === ov) fechar(); });
  const x = ov.querySelector('.ws-x'); x.addEventListener('click', fechar); x.focus();

  const responder = (txt) => {
    const m = document.createElement('div'); m.className = 'ws-m ela';
    m.innerHTML = `${esc(txt)}<span class="ws-t">${hora()}</span>`;
    corpo.appendChild(m); corpo.scrollTop = corpo.scrollHeight;
  };
  depois(700, () => { tick.textContent = '✓✓'; tick.setAttribute('aria-label', 'entregue'); });
  depois(1400, () => { tick.classList.add('lido'); tick.setAttribute('aria-label', 'lida'); st.innerHTML = '<span class="ws-d" aria-label="digitando"><b></b><b></b><b></b></span>'; });
  depois(3000, () => { st.textContent = 'online'; responder('Oi! Recebemos seu pedido 😊 Já separamos aqui. Agora é só mandar a arte em PDF (CMYK, 3 mm de sangria) que enviamos a prova digital para aprovação.'); });
  depois(4200, () => responder('Pagando no Pix você ganha 5% de desconto. Assim que confirmar, o pedido entra em produção.'));
}
