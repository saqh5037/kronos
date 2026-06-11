from PIL import Image, ImageDraw
import os

base = "/Users/samuelquiroz/Documents/proyectos/kronos/folletos-evento"

# Hoja carta a 300 DPI
SHEET_W = 2550
SHEET_H = 3300
# Mini size
MINI_W = 1275
MINI_H = 1650

# Marcas de corte (crop marks) - longitud en px
MARK_LEN = 18
MARK_COLOR = (80, 80, 80)

src_name = "KRONOS-MINI-04-BOX-300dpi.png"
out_name = "PRINT-SHEET-04-BOX-1UP"

src_path = os.path.join(base, src_name)
img = Image.open(src_path).convert("RGB")

# Crear canvas blanco
sheet = Image.new("RGB", (SHEET_W, SHEET_H), (255, 255, 255))
draw = ImageDraw.Draw(sheet)

# Centrar el mini en la hoja
x = (SHEET_W - img.width) // 2
y = (SHEET_H - img.height) // 2
sheet.paste(img, (x, y))

# Dibujar marcas de corte alrededor del mini
# Top-left
draw.line([(x - MARK_LEN, y), (x, y)], fill=MARK_COLOR, width=1)
draw.line([(x, y - MARK_LEN), (x, y)], fill=MARK_COLOR, width=1)
# Top-right
draw.line([(x + img.width, y), (x + img.width + MARK_LEN, y)], fill=MARK_COLOR, width=1)
draw.line([(x + img.width, y - MARK_LEN), (x + img.width, y)], fill=MARK_COLOR, width=1)
# Bottom-left
draw.line([(x - MARK_LEN, y + img.height), (x, y + img.height)], fill=MARK_COLOR, width=1)
draw.line([(x, y + img.height), (x, y + img.height + MARK_LEN)], fill=MARK_COLOR, width=1)
# Bottom-right
draw.line([(x + img.width, y + img.height), (x + img.width + MARK_LEN, y + img.height)], fill=MARK_COLOR, width=1)
draw.line([(x + img.width, y + img.height), (x + img.width, y + img.height + MARK_LEN)], fill=MARK_COLOR, width=1)

# Guardar PNG
png_path = os.path.join(base, f"{out_name}-300dpi.png")
sheet.save(png_path, "PNG", dpi=(300, 300))
print(f"  ✅ PNG: {png_path}")

# Guardar PDF
pdf_path = os.path.join(base, f"{out_name}.pdf")
sheet.save(pdf_path, "PDF", resolution=300.0)
print(f"  ✅ PDF: {pdf_path}")

print("\n🚀 Print sheet 1-UP lista!")
