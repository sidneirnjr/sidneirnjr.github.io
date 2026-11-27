"""Gera a foto em retícula CMYK (meio-tom) para a seção Sobre."""
import math, sys
from PIL import Image, ImageDraw, ImageOps

src, out, size, cell = sys.argv[1], sys.argv[2], 640, 7
img = Image.open(src).convert("RGB").resize((size, size), Image.LANCZOS)
img = ImageOps.autocontrast(img, cutoff=1)
import numpy as np
rgb = np.asarray(img).astype(float) / 255
c, m, y = 1 - rgb[..., 0], 1 - rgb[..., 1], 1 - rgb[..., 2]
k = np.minimum(np.minimum(c, m), y) * 0.85  # GCR: preto substitui parte do CMY
den = np.maximum(1 - k, 1e-3)
chans = [np.clip((c - k) / den * (1 - k), 0, 1), np.clip((m - k) / den * (1 - k), 0, 1), np.clip((y - k) / den * (1 - k), 0, 1), k]
bands = [Image.fromarray((ch * 255).astype("uint8")) for ch in chans]
paper = (242, 239, 232)
inks = {0: (0, 180, 230), 1: (255, 46, 136), 2: (255, 212, 0), 3: (20, 20, 22)}
angles = {0: 15, 1: 75, 2: 0, 3: 45}
SS = 3  # supersampling
canvas = Image.new("RGB", (size * SS, size * SS), paper)
for ch in (2, 0, 1, 3):
    band = bands[ch]
    layer = Image.new("L", (size * SS, size * SS), 0)
    d = ImageDraw.Draw(layer)
    a = math.radians(angles[ch]); ca, sa = math.cos(a), math.sin(a)
    rng = int(size * 1.5 / cell)
    for i in range(-rng, rng):
        for j in range(-rng, rng):
            x = (i * ca - j * sa) * cell + size / 2
            y = (i * sa + j * ca) * cell + size / 2
            if not (0 <= x < size and 0 <= y < size):
                continue
            v = band.getpixel((int(x), int(y))) / 255
            if ch == 3: v = max(0, v - 0.1) * 1.1
            r = cell * 0.62 * math.sqrt(v)
            if r < 0.3: continue
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=255)
    ink = Image.new("RGB", canvas.size, inks[ch])
    # multiplica a tinta sobre o papel (sobreposição de tintas)
    from PIL import ImageChops
    mult = ImageChops.multiply(canvas, ink)
    canvas = Image.composite(mult, canvas, layer)
canvas = canvas.resize((size, size), Image.LANCZOS)
canvas.save(out, quality=82)
print("ok", out)
