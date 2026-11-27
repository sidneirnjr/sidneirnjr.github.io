"""Remove o fundo branco que sobrou entre as pernas e acima do braço do mascote do Prontyn e gera o webp."""
import sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA")
W, H = im.size
px = im.load()

def claro(p, lim):
    r, g, b, a = p
    return a > 0 and min(r, g, b) > lim and max(r, g, b) - min(r, g, b) < 28

# preenche a partir de pontos no fundo que ficou preso: entre as pernas e entre o leque, a cabeça e o braço
seeds = [(205, 330), (130, 205)]
for sd in seeds:
    assert claro(px[sd], 200), (sd, px[sd])
st, area = list(seeds), set(seeds)
while st:
    x, y = st.pop()
    for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= n[0] < W and 0 <= n[1] < H and n not in area and claro(px[n], 196):
            area.add(n); st.append(n)
for x, y in area:
    r, g, b, a = px[x, y]
    px[x, y] = (r, g, b, 0)
# borda: pixels de antialias encostados na área viram semitransparentes, sem halo branco
for x, y in list(area):
    for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= n[0] < W and 0 <= n[1] < H and n not in area:
            r, g, b, a = px[n]
            luz = min(r, g, b)
            if luz > 150 and a > 0:
                k = (luz - 150) / 105  # quanto mais claro, mais transparente
                px[n] = (r, g, b, int(a * (1 - 0.85 * k)))
print(len(area), "pixels removidos")
w = 340
im.resize((w, round(H * w / W)), Image.LANCZOS).save(out, quality=88)
