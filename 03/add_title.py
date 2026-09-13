from PIL import Image, ImageDraw, ImageFont

SRC = r"D:\shengqu\03\assets\ebf2e265-704d-4ecb-a7e9-7d21edbae659.png"
OUT = r"D:\shengqu\03\assets\cover_with_title.png"
FONT = r"C:\Windows\Fonts\simhei.ttf"
TITLE = "《我的快餐店不可能破产！？》"

img = Image.open(SRC).convert("RGBA")
W, H = img.size
print("image size:", W, H)

draw = ImageDraw.Draw(img)

# 1) 选一个基准字号测量，再自动缩放到占宽 90%
base = 120
f = ImageFont.truetype(FONT, base)
bbox = draw.textbbox((0, 0), TITLE, font=f)
tw = bbox[2] - bbox[0]
target_w = W * 0.90
scale = target_w / tw
size = int(base * scale)
f = ImageFont.truetype(FONT, size)
print("font size:", size)

# 2) 居中位置：顶部标题区（约 13% 高度处为文字中心）
bbox = draw.textbbox((0, 0), TITLE, font=f)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
cx = (W - tw) / 2
cy = H * 0.135 - th / 2
# 把文字锚点对齐到左上角（含偏移修正）
x = cx - bbox[0]
y = cy - bbox[1]

# 3) 绘制：阴影 + 黑描边 + 白填充
shadow = int(size * 0.04)
stroke = max(2, int(size * 0.10))
draw.text((x + shadow, y + shadow), TITLE, font=f, fill=(0, 0, 0, 120))
draw.text((x, y), TITLE, font=f, fill=(255, 255, 255, 255),
          stroke_width=stroke, stroke_fill=(20, 20, 20, 255))

img.convert("RGB").save(OUT, "PNG")
print("saved:", OUT)
