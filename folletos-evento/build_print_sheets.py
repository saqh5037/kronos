from PIL import Image, ImageDraw
import os

base = "/Users/samuelquiroz/Documents/proyectos/kronos/folletos-evento"

# Hoja carta a 300 DPI
SHEET_W = 2550
SHEET_H = 3300
# 2x2 grid
COL_W = SHEET_W // 2
ROW_H = SHEET_H // 2
# Marcas de corte (crop marks) - longitud en px
MARK_LEN = 18
MARK_COLOR = (80, 80, 80)

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
    draw = ImageDraw.Draw(sheet)
    
    # Pegar 4 copias en grid 2x2
    for row in range(2):
        for col in range(2):
            x = col * COL_W + (COL_W - img.width) // 2
            y = row * ROW_H + (ROW_H - img.height) // 2
            sheet.paste(img, (x, y))
    
    # Dibujar marcas de corte (crop marks) en las líneas de división
    # Vertical center line
    cx = COL_W
    for y in range(0, SHEET_H, MARK_LEN * 3):
        draw.line([(cx, y), (cx, y + MARK_LEN)], fill=MARK_COLOR, width=1)
        draw.line([(cx, y + MARK_LEN * 2), (cx, y + MARK_LEN * 3)], fill=MARK_COLOR, width=1)
    # Horizontal center line
    cy = ROW_H
    for x in range(0, SHEET_W, MARK_LEN * 3):
        draw.line([(x, cy), (x + MARK_LEN, cy)], fill=MARK_COLOR, width=1)
        draw.line([(x + MARK_LEN * 2, cy), (x + MARK_LEN * 3, cy)], fill=MARK_COLOR, width=1)
    
    # También marcas en los bordes exteriores (4 esquinas de la hoja)
    corners = [
        (0, 0), (SHEET_W, 0), (0, SHEET_H), (SHEET_W, SHEET_H)
    ]
    
    # Guardar PNG
    png_path = os.path.join(base, f"{out_name}-300dpi.png")
    sheet.save(png_path, "PNG", dpi=(300, 300))
    print(f"  ✅ PNG: {png_path}")
    
    # Guardar PDF
    pdf_path = os.path.join(base, f"{out_name}.pdf")
    sheet.save(pdf_path, "PDF", resolution=300.0)
    print(f"  ✅ PDF: {pdf_path}")

print("\n🚀 ¡Print sheets listos!")
