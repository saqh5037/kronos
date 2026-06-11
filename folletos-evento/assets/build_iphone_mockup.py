#!/usr/bin/env python3
"""
Build a realistic iPhone 15 Pro Max mockup with the athlete home screenshot.
High-res version for large print poster.
Output: iphone-final-mockup.png
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Config (2x larger for print quality) ─────────────────────────────
PHONE_W = 1440         # phone frame width in px
PHONE_H = 2960         # phone frame height
SCREEN_W = 1320        # screen area width
SCREEN_H = 2840        # screen area height
CORNER_R = 176         # corner radius
DI_ISLAND_W = 240      # dynamic island width
DI_ISLAND_H = 68       # dynamic island height
STATUS_H = 88          # status bar height
HOME_IND_H = 10        # home indicator height
HOME_IND_W = 280

OUTPUT_SIZE = (PHONE_W + 400, PHONE_H + 400)  # extra for shadow

def rounded_rect(draw, xy, radius, fill):
    """Draw a filled rounded rectangle."""
    x1, y1, x2, y2 = xy
    r = radius
    draw.rectangle([x1 + r, y1, x2 - r, y2], fill=fill)
    draw.rectangle([x1, y1 + r, x2, y2 - r], fill=fill)
    draw.ellipse([x1, y1, x1 + r * 2, y1 + r * 2], fill=fill)
    draw.ellipse([x2 - r * 2, y1, x2, y1 + r * 2], fill=fill)
    draw.ellipse([x1, y2 - r * 2, x1 + r * 2, y2], fill=fill)
    draw.ellipse([x2 - r * 2, y2 - r * 2, x2, y2], fill=fill)

# ── 1. Create shadow layer ──────────────────────────────────────────
shadow = Image.new('RGBA', OUTPUT_SIZE, (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
off_x, off_y = 200, 200

shadow_rect = [
    off_x - 40, off_y - 40,
    off_x + PHONE_W + 40, off_y + PHONE_H + 40
]
rounded_rect(sd, shadow_rect, CORNER_R + 40, (0, 0, 0, 50))
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=80))

# ── 2. Create phone frame ───────────────────────────────────────────
phone = Image.new('RGBA', OUTPUT_SIZE, (0, 0, 0, 0))
d = ImageDraw.Draw(phone)

# Frame bezel (outer) - dark titanium
frame_rect = [off_x, off_y, off_x + PHONE_W, off_y + PHONE_H]
rounded_rect(d, frame_rect, CORNER_R, (20, 20, 22, 255))

# Inner bezel highlight
inner_pad = 16
inner_rect = [
    off_x + inner_pad, off_y + inner_pad,
    off_x + PHONE_W - inner_pad, off_y + PHONE_H - inner_pad
]
rounded_rect(d, inner_rect, CORNER_R - 8, (10, 10, 12, 255))

# ── 3. Screen mask ──────────────────────────────────────────────────
screen_off_x = off_x + (PHONE_W - SCREEN_W) // 2
screen_off_y = off_y + (PHONE_H - SCREEN_H) // 2

# ── 4. Load and place athlete screenshot ────────────────────────────
screenshot = Image.open('/Users/samuelquiroz/Documents/proyectos/kronos/public/manual/atleta/home.png')
ss_ratio = SCREEN_W / screenshot.width
new_h = int(screenshot.height * ss_ratio)
screenshot = screenshot.resize((SCREEN_W, new_h), Image.LANCZOS)

if new_h > SCREEN_H:
    screenshot = screenshot.crop((0, 0, SCREEN_W, SCREEN_H))
else:
    padded = Image.new('RGB', (SCREEN_W, SCREEN_H), (0, 0, 0))
    y_offset = (SCREEN_H - new_h) // 2
    padded.paste(screenshot, (0, y_offset))
    screenshot = padded

if screenshot.mode != 'RGBA':
    screenshot = screenshot.convert('RGBA')

# Screen mask with rounded corners
ss_mask = Image.new('L', screenshot.size, 0)
ssm = ImageDraw.Draw(ss_mask)
ssm.rounded_rectangle([0, 0, SCREEN_W, SCREEN_H], radius=CORNER_R - 24, fill=255)

phone.paste(screenshot, (screen_off_x, screen_off_y), ss_mask)

# ── 5. Status Bar ───────────────────────────────────────────────────
status_bar = Image.new('RGBA', (SCREEN_W, STATUS_H), (0, 0, 0, 160))
phone.paste(status_bar, (screen_off_x, screen_off_y), status_bar.split()[3])

# Use larger font for high-res
try:
    sf_path = "/System/Library/Fonts/SFNSDisplayCondensed-Bold.otf"
    import os
    if os.path.exists(sf_path):
        time_font = ImageFont.truetype(sf_path, 52)
    else:
        time_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
except:
    time_font = ImageFont.load_default()

d.text((screen_off_x + 56, screen_off_y + 16), "9:41", fill=(255, 255, 255, 230), font=time_font)

# Signal bars
for i, h in enumerate([12, 20, 28, 36]):
    bx = screen_off_x + SCREEN_W - 260 + i * 12
    by = screen_off_y + STATUS_H - 20 - h
    d.rectangle([bx, by, bx + 8, by + h], fill=(255, 255, 255, 220))

# WiFi
wifi_x = screen_off_x + SCREEN_W - 192
wifi_y = screen_off_y + 28
for i, r in enumerate([8, 12, 16]):
    d.arc([wifi_x - r, wifi_y - r + i*4, wifi_x + r, wifi_y + r + i*4], 200, 340, fill=(255,255,255,200), width=3)

# Battery
bat_x = screen_off_x + SCREEN_W - 116
bat_y = screen_off_y + 24
bat_w, bat_h = 56, 26
d.rounded_rectangle([bat_x, bat_y, bat_x + bat_w, bat_y + bat_h], radius=6, outline=(255,255,255,200), width=3)
d.rounded_rectangle([bat_x + 4, bat_y + 4, bat_x + bat_w - 4, bat_y + bat_h - 4], radius=4, fill=(255,255,255,220))
d.rectangle([bat_x + bat_w, bat_y + 8, bat_x + bat_w + 4, bat_y + bat_h - 8], fill=(255,255,255,200))

# ── 6. Dynamic Island ───────────────────────────────────────────────
di_x = off_x + PHONE_W // 2 - DI_ISLAND_W // 2
di_y = off_y + 36
di = Image.new('RGBA', (DI_ISLAND_W + 8, DI_ISLAND_H + 8), (0, 0, 0, 0))
di_d = ImageDraw.Draw(di)
di_d.rounded_rectangle([0, 0, DI_ISLAND_W, DI_ISLAND_H], radius=DI_ISLAND_H // 2, fill=(8, 8, 10, 240))
di_d.rounded_rectangle([2, 2, DI_ISLAND_W - 2, DI_ISLAND_H - 2], radius=DI_ISLAND_H // 2, outline=(40, 40, 45, 100), width=2)
phone.paste(di, (di_x, di_y), di)

# ── 7. Bottom home indicator ────────────────────────────────────────
home_x = off_x + PHONE_W // 2 - HOME_IND_W // 2
home_y = off_y + PHONE_H - 32
d.rounded_rectangle([home_x, home_y, home_x + HOME_IND_W, home_y + HOME_IND_H], radius=HOME_IND_H // 2, fill=(255, 255, 255, 160))

# ── 8. Side buttons ────────────────────────────────────────────────
btn_w = 8
btn_h1 = 72
btn_h2 = 120
btn_color = (35, 35, 38, 255)
d.rectangle([off_x - btn_w, off_y + 360, off_x, off_y + 360 + btn_h1], fill=btn_color)
d.rectangle([off_x - btn_w, off_y + 460, off_x, off_y + 460 + btn_h2], fill=btn_color)
d.rectangle([off_x + PHONE_W, off_y + 440, off_x + PHONE_W + btn_w, off_y + 440 + 180], fill=btn_color)

# ── 9. Glass reflection ────────────────────────────────────────────
reflection = Image.new('RGBA', OUTPUT_SIZE, (0, 0, 0, 0))
ref_d = ImageDraw.Draw(reflection)
for i in range(120):
    alpha = int(12 * (1 - abs(i - 60) / 60))
    x1 = off_x + PHONE_W * 0.3 + i * 8
    x2 = x1 + 16
    ref_d.polygon([
        (x1, off_y),
        (x2, off_y),
        (x2 - 240, off_y + PHONE_H),
        (x1 - 240, off_y + PHONE_H)
    ], fill=(255, 255, 255, alpha))
phone = Image.alpha_composite(phone, reflection)

# ── 10. Composite ───────────────────────────────────────────────────
final = Image.alpha_composite(shadow, phone)
bbox = final.getbbox()
if bbox:
    final = final.crop(bbox)

final.save('/Users/samuelquiroz/Documents/proyectos/kronos/folletos-evento/assets/iphone-final-mockup.png')
print(f"Saved: iphone-final-mockup.png ({final.size})")
