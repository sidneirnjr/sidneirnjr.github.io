"""
Relatório de vendas a partir de uma planilha (CSV).

Lê a planilha exportada do sistema ou do Excel, limpa os dados (valores em
formato brasileiro, linhas incompletas, pedidos duplicados) e calcula os
números que o dono do negócio precisa ver: faturamento por mês, produtos e
clientes que mais vendem, formas de pagamento e alertas.

Uso no terminal:
    python relatorio_vendas.py vendas.csv            # imprime o resumo
    python relatorio_vendas.py vendas.csv --html     # gera relatorio.html

Só usa a biblioteca padrão do Python, então roda em qualquer lugar,
inclusive dentro do navegador (Pyodide).

Autor: Sidnei Rodrigues · github.com/sidneirnjr
"""

from __future__ import annotations

import csv
import html
import io
import json
import sys
from collections import Counter, defaultdict
from datetime import date, datetime

MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
COLUNAS = {"data", "pedido", "cliente", "produto", "quantidade", "valor", "pagamento"}


def para_numero(texto: str) -> float:
    """Converte 'R$ 1.234,56', '1234.56' ou '1234,5' em float."""
    t = str(texto).strip().replace("R$", "").replace(" ", "")
    if not t:
        raise ValueError("valor vazio")
    if "," in t:
        t = t.replace(".", "").replace(",", ".")
    return float(t)


def para_data(texto: str) -> date:
    t = texto.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(t, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"data inválida: {texto!r}")


def ler_vendas(texto_csv: str):
    """Lê o CSV e devolve (vendas válidas, problemas encontrados)."""
    amostra = texto_csv[:2048]
    try:
        dialeto = csv.Sniffer().sniff(amostra, delimiters=",;\t")
    except csv.Error:
        dialeto = csv.excel
    leitor = csv.DictReader(io.StringIO(texto_csv), dialect=dialeto)
    leitor.fieldnames = [c.strip().lower() for c in (leitor.fieldnames or [])]
    faltando = COLUNAS - set(leitor.fieldnames)
    if faltando:
        raise ValueError("Colunas faltando na planilha: " + ", ".join(sorted(faltando)))

    vendas, problemas, vistos = [], Counter(), set()
    for linha in leitor:
        try:
            pedido = linha["pedido"].strip()
            if pedido in vistos:
                problemas["pedido duplicado"] += 1
                continue
            venda = {
                "data": para_data(linha["data"]),
                "pedido": pedido,
                "cliente": linha["cliente"].strip().title(),
                "produto": linha["produto"].strip().capitalize(),
                "quantidade": int(para_numero(linha["quantidade"])),
                "valor": para_numero(linha["valor"]),
                "pagamento": (linha["pagamento"] or "não informado").strip().lower(),
            }
            if not venda["cliente"] or not venda["produto"]:
                raise ValueError("campo vazio")
            vistos.add(pedido)
            vendas.append(venda)
        except (ValueError, KeyError, AttributeError):
            problemas["linha incompleta ou inválida"] += 1
    return vendas, dict(problemas)


def gerar_relatorio(texto_csv: str) -> dict:
    vendas, problemas = ler_vendas(texto_csv)
    if not vendas:
        raise ValueError("Nenhuma venda válida encontrada na planilha.")

    total = sum(v["valor"] for v in vendas)
    por_mes = defaultdict(float)
    pedidos_mes = Counter()
    por_produto = defaultdict(float)
    qtd_produto = Counter()
    por_cliente = defaultdict(float)
    ultima_compra = {}
    por_pagamento = defaultdict(float)
    por_dia = defaultdict(float)

    for v in vendas:
        chave = v["data"].strftime("%Y-%m")
        por_mes[chave] += v["valor"]
        pedidos_mes[chave] += 1
        por_produto[v["produto"]] += v["valor"]
        qtd_produto[v["produto"]] += v["quantidade"]
        por_cliente[v["cliente"]] += v["valor"]
        ultima_compra[v["cliente"]] = max(ultima_compra.get(v["cliente"], v["data"]), v["data"])
        por_pagamento[v["pagamento"]] += v["valor"]
        por_dia[v["data"].weekday()] += v["valor"]

    meses = sorted(por_mes)
    serie = [
        {"mes": m, "rotulo": f"{MESES[int(m[5:]) - 1]}/{m[2:4]}", "valor": round(por_mes[m], 2), "pedidos": pedidos_mes[m]}
        for m in meses
    ]
    crescimento = None
    if len(meses) >= 2 and por_mes[meses[-2]]:
        crescimento = (por_mes[meses[-1]] / por_mes[meses[-2]] - 1) * 100

    ref = max(v["data"] for v in vendas)
    sumidos = sorted(
        ((c, (ref - d).days, por_cliente[c]) for c, d in ultima_compra.items() if (ref - d).days >= 60),
        key=lambda x: -x[2],
    )[:5]

    alertas = []
    if crescimento is not None and crescimento < -10:
        alertas.append(f"O faturamento de {serie[-1]['rotulo']} caiu {abs(crescimento):.0f}% em relação ao mês anterior.")
    for c, dias, valor in sumidos:
        alertas.append(f"{c} não compra há {dias} dias (já comprou {brl(valor)}). Vale um contato.")
    top_prod = max(por_produto, key=por_produto.get)
    alertas.append(f"{top_prod} responde por {por_produto[top_prod] / total * 100:.0f}% do faturamento.")

    def top(d, n=5):
        return [{"nome": k, "valor": round(v, 2), "pct": round(v / total * 100, 1)} for k, v in sorted(d.items(), key=lambda x: -x[1])[:n]]

    return {
        "periodo": {"inicio": min(v["data"] for v in vendas).isoformat(), "fim": ref.isoformat()},
        "linhas_validas": len(vendas),
        "problemas": problemas,
        "faturamento": round(total, 2),
        "pedidos": len(vendas),
        "ticket_medio": round(total / len(vendas), 2),
        "crescimento_ultimo_mes": None if crescimento is None else round(crescimento, 1),
        "por_mes": serie,
        "top_produtos": [dict(p, unidades=qtd_produto[p["nome"]]) for p in top(por_produto)],
        "top_clientes": top(por_cliente),
        "pagamentos": top(por_pagamento, 10),
        "melhor_dia": DIAS[max(por_dia, key=por_dia.get)],
        "alertas": alertas,
    }


def brl(v: float) -> str:
    return "R$ " + f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def resumo_texto(r: dict) -> str:
    linhas = [
        "=" * 52,
        " RELATÓRIO DE VENDAS",
        f" {r['periodo']['inicio']} a {r['periodo']['fim']}",
        "=" * 52,
        f" Faturamento ........ {brl(r['faturamento'])}",
        f" Pedidos ............ {r['pedidos']}",
        f" Ticket médio ....... {brl(r['ticket_medio'])}",
    ]
    if r["crescimento_ultimo_mes"] is not None:
        linhas.append(f" Último mês ......... {r['crescimento_ultimo_mes']:+.1f}% vs. mês anterior")
    linhas.append(f" Melhor dia ......... {r['melhor_dia']}")
    if r["problemas"]:
        linhas.append(" Limpeza dos dados:")
        plural = {"pedido duplicado": "pedidos duplicados", "linha incompleta ou inválida": "linhas incompletas ou inválidas"}
        for k, n in r["problemas"].items():
            linhas.append(f"   - {n} {k if n == 1 else plural.get(k, k)} → fora do cálculo" if n > 1 else f"   - 1 {k} → fora do cálculo")
    linhas.append("-" * 52)
    linhas.append(" Produtos que mais faturam:")
    for i, p in enumerate(r["top_produtos"], 1):
        linhas.append(f"   {i}. {p['nome']:<20} {brl(p['valor']):>14}  {p['pct']:>5.1f}%")
    linhas.append(" Alertas:")
    for a in r["alertas"]:
        linhas.append(f"   ! {a}")
    return "\n".join(linhas)


def relatorio_html(r: dict) -> str:
    e = html.escape
    maior = max(m["valor"] for m in r["por_mes"]) or 1
    barras = "".join(
        f'<div class="b"><i style="height:{m["valor"] / maior * 100:.1f}%"></i><span>{e(m["rotulo"])}</span></div>'
        for m in r["por_mes"]
    )
    prods = "".join(
        f"<tr><td>{e(p['nome'])}</td><td>{p['unidades']:,}</td><td>{brl(p['valor'])}</td><td>{p['pct']}%</td></tr>".replace(f"{p['unidades']:,}", f"{p['unidades']:,}".replace(",", "."))
        for p in r["top_produtos"]
    )
    clis = "".join(f"<tr><td>{e(c['nome'])}</td><td>{brl(c['valor'])}</td><td>{c['pct']}%</td></tr>" for c in r["top_clientes"])
    alertas = "".join(f"<li>{e(a)}</li>" for a in r["alertas"])
    return f"""<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Relatório de vendas</title>
<style>body{{font:15px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#111}}
h1{{margin:0}}.k{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}}.k div{{border:1px solid #ddd;border-radius:12px;padding:14px}}
.k b{{display:block;font-size:24px}}.g{{display:flex;gap:6px;align-items:end;height:180px;border-bottom:1px solid #ddd;margin:20px 0}}
.b{{flex:1;display:flex;flex-direction:column;justify-content:end;height:100%;text-align:center;font-size:11px;color:#666}}
.b i{{background:#e6007e;border-radius:4px 4px 0 0;display:block}}table{{width:100%;border-collapse:collapse;margin:12px 0 24px}}
td,th{{text-align:left;padding:6px 8px;border-bottom:1px solid #eee}}</style>
<h1>Relatório de vendas</h1><p>{r['periodo']['inicio']} a {r['periodo']['fim']} · {r['pedidos']} pedidos</p>
<div class="k"><div>Faturamento<b>{brl(r['faturamento'])}</b></div><div>Ticket médio<b>{brl(r['ticket_medio'])}</b></div>
<div>Último mês<b>{'' if r['crescimento_ultimo_mes'] is None else f"{r['crescimento_ultimo_mes']:+.1f}%"}</b></div></div>
<h2>Faturamento por mês</h2><div class="g">{barras}</div>
<h2>Produtos</h2><table><tr><th>Produto</th><th>Unidades</th><th>Faturamento</th><th>%</th></tr>{prods}</table>
<h2>Clientes que mais compram</h2><table><tr><th>Cliente</th><th>Faturamento</th><th>%</th></tr>{clis}</table>
<h2>Alertas</h2><ul>{alertas}</ul><p style="color:#888">Gerado automaticamente por relatorio_vendas.py</p></html>"""


def executar_json(texto_csv: str) -> str:
    """Ponto de entrada usado pela página: devolve o relatório em JSON."""
    r = gerar_relatorio(texto_csv)
    print(resumo_texto(r))
    r["html"] = relatorio_html(r)
    return json.dumps(r, ensure_ascii=False)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 1
    with open(argv[1], encoding="utf-8-sig") as f:
        r = gerar_relatorio(f.read())
    print(resumo_texto(r))
    if "--html" in argv:
        with open("relatorio.html", "w", encoding="utf-8") as f:
            f.write(relatorio_html(r))
        print("\nRelatório salvo em relatorio.html")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
