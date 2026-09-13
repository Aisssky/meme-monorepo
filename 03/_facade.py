# -*- coding: utf-8 -*-
"""商城门面贴图 v4：10 家差异化店铺。

每家店：不同门楣配色 + 不同招牌名 + 不同色调的橱窗内景，
解锁后整块覆盖原图的灰玻璃门面，做到像素级对齐。
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

W_IMG, H_IMG = 1440, 2560
OUT = 'D:/shengqu/03/assets'
FONT = 'C:/Windows/Fonts/simhei.ttf'
SCENE = Image.open('D:/shengqu/03/assets/scene_shop_inside.png').convert('RGB')

MARGIN = 12   # 外投影留白

# (idx, 店名, x0, x1, y0, y1, 门楣色亮, 门楣色暗, 朝向, 橱窗色调(RGB 乘子), 橱窗暖光RGB)
SHOPS = [
    (1, '香脆薯条', 0.6115, 0.7785, 0.6670, 0.8060, (255, 190, 74), (214, 112, 30), 'v', (1.05, 1.00, 0.88), (255, 200, 120)),
    (2, '手工披萨', 0.2230, 0.4820, 0.5640, 0.6110, (255, 152, 96), (198, 62, 38), 'h', (1.06, 0.97, 0.90), (255, 160, 110)),
    (3, '暖心面条', 0.5340, 0.7910, 0.5640, 0.6520, (255, 196, 112), (188, 122, 48), 'h', (1.04, 1.00, 0.90), (255, 190, 120)),
    (4, '元气寿司', 0.2230, 0.4820, 0.4580, 0.5460, (150, 214, 206), (52, 146, 158), 'h', (0.88, 1.03, 1.05), (130, 220, 220)),
    (5, '沸腾火锅', 0.5340, 0.7910, 0.4580, 0.5460, (255, 124, 92), (186, 40, 30), 'h', (1.10, 0.90, 0.84), (255, 120, 80)),
    (6, '醇香咖啡', 0.2230, 0.4820, 0.3460, 0.4400, (206, 158, 110), (128, 84, 48), 'h', (1.02, 0.94, 0.84), (255, 176, 110)),
    (7, '甜心雪糕', 0.5340, 0.7910, 0.3460, 0.4400, (255, 176, 196), (216, 92, 132), 'h', (1.04, 0.98, 1.02), (255, 180, 210)),
    (8, '香辣炸鸡', 0.2230, 0.4820, 0.2480, 0.3340, (255, 176, 62), (206, 88, 20), 'h', (1.07, 0.97, 0.86), (255, 180, 90)),
    (9, '甜甜圈屋', 0.5340, 0.7910, 0.2480, 0.3340, (252, 164, 202), (198, 78, 138), 'h', (1.03, 0.97, 1.03), (255, 170, 205)),
]

CROP_H = SCENE.crop((60, 370, 2500, 1280))     # 2.68 : 1


def lerp(a, b, t):
    return a + (b - a) * t


def vgrad(size, cs):
    w, h = size
    img = Image.new('RGBA', size)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        c = cs[-1][1]
        for i in range(len(cs) - 1):
            p0, c0 = cs[i]
            p1, c1 = cs[i + 1]
            if p0 <= t <= p1:
                k = (t - p0) / max(1e-6, p1 - p0)
                c = tuple(int(lerp(c0[j], c1[j], k)) for j in range(3))
                break
        d.line([(0, y), (w, y)], fill=c + (255,))
    return img


def tint(im, mult):
    """按 RGB 乘子做色调偏移，营造不同品类的橱窗氛围"""
    r, g, b = im.split()[:3]
    r = r.point(lambda v: min(255, int(v * mult[0])))
    g = g.point(lambda v: min(255, int(v * mult[1])))
    b = b.point(lambda v: min(255, int(v * mult[2])))
    return Image.merge('RGB', (r, g, b))


def cover(im, size):
    tw, th = size
    sw, sh = im.size
    s = max(tw / sw, th / sh)
    im2 = im.resize((max(1, int(sw * s)), max(1, int(sh * s))), Image.LANCZOS)
    x = (im2.size[0] - tw) // 2
    y = (im2.size[1] - th) // 2
    return im2.crop((x, y, x + tw, y + th))


def make(idx, name, x0, x1, y0, y1, top_c, dark_c, orient, mult, warm_c):
    gx0, gy0 = int(x0 * W_IMG), int(y0 * H_IMG)
    gx1, gy1 = int(x1 * W_IMG), int(y1 * H_IMG)
    FW, FH = gx1 - gx0, gy1 - gy0
    TW, TH = FW + MARGIN * 2, FH + MARGIN * 2
    R = int(min(FW, FH) * 0.07)

    tile = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))

    # ---------- 外投影 ----------
    sh = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([MARGIN - 3, MARGIN + 2, MARGIN + FW + 3, MARGIN + FH + 8],
                                         radius=R, fill=(40, 22, 10, 90))
    sh = sh.filter(ImageFilter.GaussianBlur(7))
    tile.alpha_composite(sh)

    # ---------- 门套外框 ----------
    d = ImageDraw.Draw(tile, 'RGBA')
    d.rounded_rectangle([MARGIN, MARGIN, MARGIN + FW - 1, MARGIN + FH - 1],
                        radius=R, fill=(128, 78, 42, 255))
    pad = max(4, int(FH * 0.022))
    ix0, iy0 = MARGIN + pad, MARGIN + pad
    IW, IH = FW - pad * 2, FH - pad * 2

    # ---------- 门楣 / 玻璃 分区 ----------
    SIGN_R = 0.30 if orient == 'v' else 0.32
    sign_h = int(IH * SIGN_R)
    glass_y = iy0 + sign_h
    glass_h = IH - sign_h

    # 门楣（木色渐变）
    sign = vgrad((IW, sign_h), [(0, top_c), (0.6, top_c), (1, dark_c)])
    tile.paste(sign, (ix0, iy0))

    # ---------- 玻璃 ----------
    src = cover(SCENE if orient == 'h' else SCENE.crop((880, 260, 1880, 1300)),
                (IW, glass_h))
    src = tint(src, mult).convert('RGBA')
    # 统一暖调（按品类变化）
    warm = Image.new('RGBA', (IW, glass_h), warm_c + (46,))
    src.alpha_composite(warm)
    gd = ImageDraw.Draw(src, 'RGBA')
    for k in range(int(glass_h * 0.16)):
        a = int(58 * (1 - k / max(1, glass_h * 0.16)))
        gd.line([(0, k), (IW, k)], fill=(120, 64, 24, a))
    for k in range(int(glass_h * 0.22)):
        a = int(70 * (k / max(1, glass_h * 0.22)))
        gd.line([(0, glass_h - 1 - k), (IW, glass_h - 1 - k)], fill=(255, 214, 140, a))
    for fx in (0.335, 0.665):
        gd.rectangle([IW * fx - 2, 0, IW * fx + 2, glass_h], fill=(255, 246, 228, 115))
        gd.rectangle([IW * fx - 3, 0, IW * fx - 2, glass_h], fill=(150, 92, 44, 70))
    refl = Image.new('RGBA', (IW, glass_h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(refl)
    rd.polygon([(0, 0), (IW * 0.30, 0), (0, glass_h * 0.92)], fill=(255, 255, 255, 58))
    rd.polygon([(IW * 0.50, 0), (IW * 0.64, 0), (IW * 0.14, glass_h)], fill=(255, 255, 255, 32))
    src.alpha_composite(refl)
    tile.paste(src, (ix0, glass_y))

    d.rectangle([ix0, glass_y - 2, ix0 + IW - 1, glass_y + 1], fill=(104, 58, 26, 220))

    # ---------- 缎带招牌 ----------
    SW = int(IW * 0.70)
    SH = int(sign_h * 0.66)
    sx = MARGIN + (FW - SW) // 2
    sy = iy0 + int((sign_h - SH) * 0.50)
    sg = Image.new('RGBA', (SW + 10, SH + 10), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sg)
    sd.rounded_rectangle([5, 5, SW + 5, SH + 5], radius=int(SH * 0.35), fill=(120, 38, 14, 255))
    band = vgrad((SW, SH), [(0, (255, 146, 54)), (0.46, (255, 204, 78)), (1, (244, 146, 38))])
    m = Image.new('L', (SW, SH), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, SW - 1, SH - 1], radius=int(SH * 0.30), fill=255)
    sg.paste(band, (5, 5), m)
    sd.rounded_rectangle([11, 9, SW - 1, int(9 + SH * 0.36)], radius=int(SH * 0.18),
                         fill=(255, 255, 255, 50))
    fs = int(SH * 0.50)
    f = None
    while fs > 8:
        f = ImageFont.truetype(FONT, fs)
        tb = sd.textbbox((0, 0), name, font=f)
        if (tb[2] - tb[0]) <= SW * 0.82:
            break
        fs -= 2
    tb = sd.textbbox((0, 0), name, font=f)
    tx = 5 + (SW - (tb[2] - tb[0])) / 2 - tb[0]
    ty = 5 + (SH - (tb[3] - tb[1])) / 2 - tb[1] - int(SH * 0.04)
    for ox, oy in ((-2, -2), (2, -2), (-2, 2), (2, 2), (0, 2), (0, -2), (2, 0), (-2, 0)):
        sd.text((tx + ox, ty + oy), name, font=f, fill=(124, 38, 14, 255))
    sd.text((tx, ty), name, font=f, fill=(255, 253, 244, 255))
    tile.alpha_composite(sg, (sx - 5, sy - 5))

    tile.save(os.path.join(OUT, 'facade_%d.png' % idx))
    return {'left': (gx0 - MARGIN) / W_IMG * 100, 'top': (gy0 - MARGIN) / H_IMG * 100,
            'w': TW / W_IMG * 100, 'h': TH / H_IMG * 100}


pos = {}
for s in SHOPS:
    pos[s[0]] = make(*s)

for k in sorted(pos):
    p = pos[k]
    print('  %d: {l:%.3f, t:%.3f, w:%.3f, h:%.3f},' % (k, p['left'], p['top'], p['w'], p['h']))
print('done')
