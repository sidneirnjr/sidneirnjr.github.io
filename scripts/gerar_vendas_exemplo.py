"""Gera a planilha fictícia de vendas usada na demo de automação (com algumas sujeiras de propósito)."""
import csv, random
from datetime import date, timedelta

random.seed(42)
clientes = ["Padaria Bom Grão", "Studio Lumi", "Auto Center Vila", "Doce Mel Confeitaria", "Pet Amigo", "Barbearia Navalha",
            "Clínica Sorriso", "Ateliê Flor de Lis", "Mercadinho Central", "Academia Forma", "Pizzaria Forno a Lenha",
            "Escola Pequeno Saber", "Ótica Visão", "Floricultura Jardim", "Café do Largo", "Imobiliária Lar", "Buffet Alegria", "Papelaria Traço"]
pesos_cli = [random.uniform(.3, 3) for _ in clientes]
produtos = {"Cartão de visita": (60, 260, [250, 500, 1000]), "Panfleto": (120, 900, [1000, 2500, 5000]),
            "Banner": (70, 380, [1, 2, 3]), "Adesivo": (40, 380, [100, 250, 500]), "Convite": (180, 900, [50, 100, 200]),
            "Cardápio": (90, 420, [20, 50, 100])}
pesos_prod = [5, 4, 3, 3, 1.5, 1.5]
pag = ["pix", "pix", "pix", "cartão", "cartão", "boleto"]
saz = {1: .7, 2: .8, 3: 1, 4: .95, 5: 1.1, 6: 1.05, 7: .9, 8: 1, 9: 1.05, 10: 1.15, 11: 1.35}
linhas, n = [], 4100
d = date(2026, 1, 2)
while d <= date(2026, 11, 26):
    if d.weekday() < 6:
        k = random.random() * 5.6 * saz[d.month] * (1.3 if d.weekday() in (0, 4) else 1)
        for _ in range(int(k)):
            prod = random.choices(list(produtos), pesos_prod)[0]
            lo, hi, qs = produtos[prod]
            cli = random.choices(clientes, pesos_cli)[0]
            if cli in ("Academia Forma", "Ótica Visão") and d > date(2026, 8, 20):
                continue  # clientes que "sumiram"
            valor = round(random.uniform(lo, hi), 2)
            linhas.append([d.isoformat(), f"P{n}", cli, prod, random.choice(qs), valor, random.choice(pag)])
            n += 1
    d += timedelta(days=1)
# sujeiras: formato brasileiro, duplicados, linhas incompletas, data em outro formato, maiúsculas
for i in random.sample(range(len(linhas)), 25):
    linhas[i][5] = "R$ " + f"{linhas[i][5]:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
for i in random.sample(range(len(linhas)), 10):
    y, m, dd = linhas[i][0].split("-"); linhas[i][0] = f"{dd}/{m}/{y}"
for i in random.sample(range(len(linhas)), 8):
    linhas[i][2] = linhas[i][2].upper()
dups = [list(linhas[i]) for i in random.sample(range(len(linhas)), 4)]
linhas += dups
linhas.insert(120, ["2026-03-10", "P9001", "", "Panfleto", 1000, "", "pix"])
linhas.insert(300, ["2026-06-02", "P9002", "Studio Lumi", "Banner", "", "abc", "cartão"])
linhas.insert(500, ["", "P9003", "Pet Amigo", "Adesivo", 250, 120, ""])
with open("public/automacao/vendas_exemplo.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["data", "pedido", "cliente", "produto", "quantidade", "valor", "pagamento"])
    w.writerows(linhas)
print(len(linhas), "linhas")
