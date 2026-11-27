export const contato = {
  email: 'sidneirnjr@prontyn.com.br',
  linkedin: 'https://www.linkedin.com/in/sidnei-rodrigues-733ba31b7/',
  github: 'https://github.com/sidneirnjr',
  // link público do perfil na Workana (preencher quando disponível)
  workana: '',
};

export const servicos = [
  { k: 'var(--C)', n: '01', t: 'Sites e landing pages', d: 'Institucionais, catálogos e páginas de venda. Rápidos, responsivos e com cara de marca, porque o design vem de fábrica.', tags: ['Astro', 'HTML/CSS/JS', 'SEO'] },
  { k: 'var(--M)', n: '02', t: 'Sistemas sob medida', d: 'Orçamentos, pedidos, cadastros, agenda e painéis. O caderno e as planilhas viram um sistema simples que a equipe usa de verdade.', tags: ['TypeScript', 'Next.js', 'Supabase'] },
  { k: 'var(--Y)', n: '03', t: 'Automações em Python', d: 'Relatórios que se montam sozinhos, planilhas que conversam entre si, PDFs gerados em lote. Horas de trabalho repetitivo viram um clique.', tags: ['Python', 'Planilhas', 'PDF'] },
  { k: 'var(--K)', n: '04', t: 'Chatbots e IA', d: 'Atendimento que responde dúvidas, faz orçamento e passa o pedido pronto para você. Com IA na nuvem ou rodando no seu próprio computador.', tags: ['LLMs', 'WhatsApp', 'IA local'] },
];

export const demos = [
  {
    slug: 'grafica', k: 'var(--C)', tipo: 'Site + orçamento',
    t: 'Landing page de gráfica com orçamento ao vivo',
    d: 'Site completo de uma gráfica fictícia: o cliente escolhe produto, quantidade e acabamento, vê o preço na hora e manda o pedido pronto pelo WhatsApp.',
    tags: ['Astro', 'JavaScript', 'Responsivo'],
  },
  {
    slug: 'chatbot', k: 'var(--M)', tipo: 'Chatbot',
    t: 'Atendente virtual que faz orçamento',
    d: 'Entende perguntas sobre prazos, arquivos e pagamento e conduz o cliente até um orçamento fechado. Roda no navegador, sem custo de API.',
    tags: ['NLP leve', 'Fluxo guiado', 'Acessível'],
  },
  {
    slug: 'painel', k: 'var(--Y)', tipo: 'Sistema',
    t: 'Painel de pedidos e produção',
    d: 'Kanban de produção com arrastar e soltar, prazos que ficam vermelhos sozinhos, faturamento do mês e gráfico de vendas. Os dados ficam salvos no navegador.',
    tags: ['Dashboard', 'Drag and drop', 'Gráficos SVG'],
  },
  {
    slug: 'automacao', k: 'var(--K)', tipo: 'Automação Python',
    t: 'Planilha de vendas → relatório em 1 clique',
    d: 'Um script Python de verdade que roda dentro do seu navegador (Pyodide): lê a planilha, calcula totais, ranking e curva de vendas e gera o relatório.',
    tags: ['Python', 'Pyodide', 'CSV'],
  },
];
