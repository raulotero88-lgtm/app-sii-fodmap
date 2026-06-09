"""
Genera los iconos PWA (icon-192.png, icon-512.png) a partir del logo de la app.
Fuente: 'Logo app.jpg' (1024x1024). Requiere: Python 3 + Pillow (pip install Pillow).
Uso: python generate-icons.py
"""
from PIL import Image
import os

SOURCE = 'Logo app.jpg'
os.makedirs('icons', exist_ok=True)

src = Image.open(SOURCE).convert('RGBA')

# Asegura un cuadrado perfecto (recorta centrado si hiciera falta).
w, h = src.size
if w != h:
    s = min(w, h)
    left = (w - s) // 2
    top = (h - s) // 2
    src = src.crop((left, top, left + s, top + s))

for size in [192, 512]:
    img = src.resize((size, size), Image.LANCZOS)
    out = f'icons/icon-{size}.png'
    img.save(out, 'PNG')
    print(f'Generated {out} ({size}x{size})')

print('Done.')
