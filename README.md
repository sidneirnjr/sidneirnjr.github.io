# sidneirnjr.github.io

Portfólio de **Sidnei Rodrigues**: designer gráfico que virou desenvolvedor de soluções para pequenos negócios e gráficas.

**No ar:** https://sidneirnjr.github.io

## O que tem aqui

- **Home** com esfera WebGL de pontos em três chapas (ciano, magenta e amarelo) que entram em registro quando o ponteiro se aproxima. WebGL puro, sem bibliotecas.
- **4 demos interativas** (empresa e dados fictícios):
  - [`/demos/grafica`](https://sidneirnjr.github.io/demos/grafica/): landing page de gráfica com orçamento ao vivo e pedido pelo WhatsApp.
  - [`/demos/chatbot`](https://sidneirnjr.github.io/demos/chatbot/): atendente virtual que tira dúvidas e fecha orçamento, com painel mostrando a intenção e as entidades detectadas.
  - [`/demos/painel`](https://sidneirnjr.github.io/demos/painel/): painel de pedidos com kanban (arrastar e soltar ou teclado), indicadores e gráficos SVG.
  - [`/demos/automacao`](https://sidneirnjr.github.io/demos/automacao/): script Python real ([`relatorio_vendas.py`](public/automacao/relatorio_vendas.py)) rodando no navegador via Pyodide.

## Stack

[Astro](https://astro.build) (site estático), TypeScript, CSS puro, WebGL e Pyodide. Publicado no GitHub Pages via GitHub Actions.

Feito com desenvolvimento assistido por IA: a IA acelera a escrita; o desenho, as decisões e os testes são meus.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/
```

O script de automação também roda sozinho:

```bash
python public/automacao/relatorio_vendas.py public/automacao/vendas_exemplo.csv --html
```

## Contato

Veja a seção [Contato](https://sidneirnjr.github.io/#contato) do site ou o [LinkedIn](https://www.linkedin.com/in/sidnei-rodrigues-733ba31b7/).
