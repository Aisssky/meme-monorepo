# -*- coding: utf-8 -*-
"""把 9 张门面贴图 + 原图已开业的 1F-左，合成到商场图上预览效果"""
from PIL import Image

W, H = 1440, 2560
base = Image.open('D:/shengqu/03/assets/scene_mall.png').convert('RGBA')

FACADE = [
    (0, 19.5,   60.6,   26.5,   20.6,   None),                        # 1F-左（原图已有）
    (1, 60.278, 66.211, 18.403, 14.844, 'assets/facade_1.png'),
    (2, 21.458, 55.898, 27.569, 5.664,  'assets/facade_2.png'),
    (3, 52.500, 55.898, 27.431, 9.766,  'assets/facade_3.png'),
    (4, 21.458, 45.312, 27.569, 9.727,  'assets/facade_4.png'),
    (5, 52.500, 45.312, 27.431, 9.727,  'assets/facade_5.png'),
    (6, 21.458, 34.102, 27.569, 10.352, 'assets/facade_6.png'),
    (7, 52.500, 34.102, 27.431, 10.352, 'assets/facade_7.png'),
    (8, 21.458, 24.297, 27.569, 9.570,  'assets/facade_8.png'),
    (9, 52.500, 24.297, 27.431, 9.570,  'assets/facade_9.png'),
]

for idx, l, t, w, h, img in FACADE:
    if not img:
        continue
    f = Image.open('D:/shengqu/03/assets/' + img.split('/')[-1]).convert('RGBA')
    tw, th = int(w / 100 * W), int(h / 100 * H)
    f = f.resize((tw, th), Image.LANCZOS)
    base.alpha_composite(f, (int(l / 100 * W), int(t / 100 * H)))

base.convert('RGB').save('D:/shengqu/03/assets/_mall_diff_preview.png')

# 建筑区放大图，方便核对
crop = base.crop((int(0.12 * W), int(0.17 * H), int(0.90 * W), int(0.85 * H))).convert('RGB')
cw, ch = crop.size
crop = crop.resize((int(cw * 1.5), int(ch * 1.5)), Image.LANCZOS)
crop.save('D:/shengqu/03/assets/_mall_diff_zoom.png')
print('ok', crop.size)
