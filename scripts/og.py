"""Gera a imagem de compartilhamento (Open Graph) 1200x630."""
import math, random
from PIL import Image, ImageDraw, ImageFont, ImageChops

W, H = 1200, 630
bg = Image.new("RGB", (W, H), (11, 11, 12))
# esfera de pontos em 3 chapas, fora de registro
random.seed(3)
golden = math.pi * (3 - math.sqrt(5))
for col, (ox, oy) in (((0, 150, 200), (-14, 6)), ((220, 30, 110), (14, 8)), ((210, 170, 0), (0, -14))):
    layer = Image.new("RGB", (W, H), (0, 0, 0)); d = ImageDraw.Draw(layer)
    N = 2600
    for i in range(N):
        y = 1 - i / (N - 1) * 2; r = math.sqrt(1 - y * y); th = golden * i
        x3, z3 = math.cos(th) * r, math.sin(th) * r
        a, ca, sa = .5, math.cos(.5), math.sin(.5)
        x3, z3 = x3 * ca + z3 * sa, -x3 * sa + z3 * ca
        if z3 < -0.2: continue
        R = 215; cx, cy = 985 + x3 * R + ox, 315 + y * R + oy
        s = 1.2 + 2.2 * (z3 + 1) / 2
        k = .35 + .65 * (z3 + 1) / 2
        d.ellipse([cx - s, cy - s, cx + s, cy + s], fill=tuple(int(c * k) for c in col))
    bg = ImageChops.add(bg, layer)
d = ImageDraw.Draw(bg)
f = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", 92)
fm = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 26)
for (txt, y) in (("DO PAPEL", 170), ("AO CÓDIGO", 290)):
    for col, dx, dy in (((0, 180, 230), 5, 0), ((255, 46, 136), -5, 3), ((242, 239, 232), 0, 0)):
        d.text((70 + dx, y + dy), txt, font=f, fill=col)
d.text((74, 90), "SIDNEI RODRIGUES", font=fm, fill=(155, 151, 143))
d.text((74, 450), "Sites · sistemas · automações · chatbots", font=fm, fill=(242, 239, 232))
d.text((74, 492), "sidneirnjr.github.io", font=fm, fill=(255, 212, 0))
bg.save("public/img/og.png", optimize=True)
print("ok")
