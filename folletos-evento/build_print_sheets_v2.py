from PIL import Image, ImageDraw
import os

base = "/Users/samuelquiroz/Documents/proyectos/kronos/folletos-evento"

# Hoja carta a 300 DPI
SHEET_W = 2550
SHEET_H = 3300
# 2x2 grid — cada celda = folleto exacto
COL_W = SHEET_W // 2   # 1275
ROW_H = SHEET_H // 2   # 1650

sheets = [
    ("KRONOS-MINI-02-NEON-300dpi.png", "PRINT-SHEET-02-NEON"),
    ("KRONOS-MINI-03-COMUNIDAD-300dpi.png", "PRINT-SHEET-03-COMUNIDAD"),
    ("KRONOS-MINI-04-BOX-300dpi.png", "PRINT-SHEET-04-BOX"),
]

for src_name, out_name in sheets:
    src_path = os.path.join(base, src_name)
    img = Image.open(src_path).convert("RGB")
    
    # Crear canvas blanco
    sheet = Image.new("RGB", (SHEET_W, SHEET_H), (255, 255, 255))
    
    # Pegar 4 copias en grid 2x2 (sin recorte, encajan perfecto)
    for row in range(2):
        for col in range(2):
            x = col * COL_W
            y = row * ROW_H
            sheet.paste(img, (x, y))
    
    # Dibujar marcas de corte (crop marks) en las líneas de división
    draw = ImageDraw.Draw(sheet)
    MARK_LEN = 18
    MARK_COLOR = (80, 80, 80)
    cx = COL_W
    cy = ROW_H
    
    # Marcas verticales (centro horizontal)
    for y in range(0, SHEET_H, MARK_LEN * 3):
        draw.line([(cx, y), (cx, y + MARK_LEN)], fill=MARK_COLOR, width=1)
        draw.line([(cx, y + MARK_LEN * 2), (cx, y + MARK_LEN * 3)], fill=MARK_COLOR, width=1)
    # Marcas horizontales (centro vertical)
    for x in range(0, SHEET_W, MARK_LEN * 3):
        draw.line([(x, cy), (x + MARK_LEN, cy)], fill=MARK_COLOR, width=1)
        draw.line([(x + MARK_LEN * 2, cy), (x + MARK_LEN * 3, cy)], fill=MARK_COLOR, width=1)
    
    # Guardar PNG
    png_path = os.path.join(base, f"{out_name}-300dpi.png")
    sheet.save(png_path, "PNG", dpi=(300, 300))
    print(f"  ✅ PNG: {png_path}")
    
    # Guardar PDF
    pdf_path = os.path.join(base, f"{out_name}.pdf")
    sheet.save(pdf_path, "PDF", resolution=300.0)
    print(f"  ✅ PDF: {pdf_path}")

print("\n🚀 ¡Print sheets listos!")
