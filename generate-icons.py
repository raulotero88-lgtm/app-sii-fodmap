"""
Script para generar iconos PWA para la app SII/FODMAP.
Genera icon-192.png e icon-512.png en la carpeta icons/.
Requiere: Python 3 + Pillow (pip install Pillow)
"""
from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('icons', exist_ok=True)

for size in [192, 512]:
    img = Image.new('RGB', (size, size), '#2ecc71')
    draw = ImageDraw.Draw(img)
    text = 'SII'
    # Try to use a bold font, fall back to default
    try:
        font_size = size // 3
        font = ImageFont.truetype('arialbd.ttf', font_size)
    except:
        try:
            font_size = size // 3
            font = ImageFont.truetype('arial.ttf', font_size)
        except:
            font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2
    y = (size - text_h) // 2
    draw.text((x, y), text, fill='white', font=font)
    img.save(f'icons/icon-{size}.png')
    print(f'Generated icons/icon-{size}.png ({size}x{size})')

print('Done.')
