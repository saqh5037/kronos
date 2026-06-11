from PIL import Image, ImageDraw
import os

base = "/Users/samuelquiroz/Documents/proyectos/kronos/folletos-evento"

# Hoja carta a 300 DPI
SHEET_W = 2550
SHEET_H = 3300
# Grid 2x2 (mismas celdas que los minis originales)
COL_W = SHEET_W // 2
ROW_H = SHEET_H // 2
# Marcas de corte
MARK_LEN = 18
MARK_COLOR = (80, 80, 80)

src_name = "DOMINUS-FICHA-JUEZ-300dpi.png"
out_name = "PRINT-SHEET-JUEZ"

src_path = os.path.join(base, src_name)
img = Image.open(src_path).convert("RGB")

# Crear canvas blanco
sheet = Image.new("RGB", (SHEET_W, SHEET_H), (255, 255, 255))
draw = ImageDraw.Draw(sheet)

# Pegar 4 copias en grid 2x2 (centro de cada celda)
for row in range(2):
    for col in range(2):
        x = col * COL_W + (COL_W - img.width) // 2
        y = row * ROW_H + (ROW_H - img.height) // 2
        sheet.paste(img, (x, y))

# Marcas de corte en las líneas de división
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

# Guardar PNG
png_path = os.path.join(base, f"{out_name}-300dpi.png")
sheet.save(png_path, "PNG", dpi=(300, 300))
print(f"  ✅ PNG: {png_path}")

# Guardar PDF
pdf_path = os.path.join(base, f"{out_name}.pdf")
sheet.save(pdf_path, "PDF", resolution=300.0)
print(f"  ✅ PDF: {pdf_path}")

print("\n🚀 Print sheet de jueces lista!")
