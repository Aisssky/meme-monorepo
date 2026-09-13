#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将 index.html 中本地 assets/ 引用改写为 TOS 公网 URL，产出自包含的 dist/index.html。"""
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "index.html")
DST_DIR = os.path.join(ROOT, "dist")
DST = os.path.join(DST_DIR, "index.html")

# 本地文件名 -> TOS 公网 URL（与 33 次上传结果一一对应）
MAP = {
    "scene_title.png":      "https://ppy-test.tos-cn-beijing.volces.com/ffassets/86ffb67c-68bc-45a6-a38c-4e3973b0bd3a.png",
    "scene_mall.png":       "https://ppy-test.tos-cn-beijing.volces.com/ffassets/8e13056e-5a5b-4361-b8c2-7a3b694c7d2d.png",
    "scene_shop_bare.png":  "https://ppy-test.tos-cn-beijing.volces.com/ffassets/7c504feb-b106-41b3-ba68-7d9d9f3c27ab.png",
    "customer_kid.png":     "https://ppy-test.tos-cn-beijing.volces.com/ffassets/e0cd0cbc-e26c-46c5-bc55-c8b0d6f9bac9.png",
    "food_burger.png":      "https://ppy-test.tos-cn-beijing.volces.com/ffassets/cc5e9bc3-640c-49e8-b78d-b0d7ba476436.png",
    "food_fries.png":       "https://ppy-test.tos-cn-beijing.volces.com/ffassets/89b23d94-5394-445e-9fa3-aa306db84ed4.png",
    "food_pizza.png":       "https://ppy-test.tos-cn-beijing.volces.com/ffassets/18d9f8f9-defc-48fa-a41e-1e21349de7d4.png",
    "food_noodles.png":     "https://ppy-test.tos-cn-beijing.volces.com/ffassets/65bbd6ae-8d59-473f-84da-86002f123346.png",
    "food_sushi.png":       "https://ppy-test.tos-cn-beijing.volces.com/ffassets/fa8d7cbe-cf13-4387-927b-3e7e8838cd96.png",
    "food_hotpot.png":      "https://ppy-test.tos-cn-beijing.volces.com/ffassets/3867ae27-acc7-4a45-89be-2385d498f5c7.png",
    "food_coffee.png":      "https://ppy-test.tos-cn-beijing.volces.com/ffassets/559599d8-61e6-433b-be3a-4a0b197081a0.png",
    "food_icecream.png":    "https://ppy-test.tos-cn-beijing.volces.com/ffassets/8b0a750f-d532-4c6b-aba7-74016c5f0cbf.png",
    "food_chicken.png":     "https://ppy-test.tos-cn-beijing.volces.com/ffassets/ac8519bc-f361-4765-872c-57b4db260a1d.png",
    "food_donut.png":       "https://ppy-test.tos-cn-beijing.volces.com/ffassets/de505cd9-6e1d-4246-8258-1615647da662.png",
    "shop_bg_fries.png":    "https://ppy-test.tos-cn-beijing.volces.com/ffassets/6e0bff8b-e4ca-4baf-80fd-1c47a2a434ff.png",
    "shop_bg_pizza.png":    "https://ppy-test.tos-cn-beijing.volces.com/ffassets/14ace986-4779-4536-94b6-a5582aa69d7d.png",
    "shop_bg_noodles.png":  "https://ppy-test.tos-cn-beijing.volces.com/ffassets/44dd7c58-c088-48b3-a7a2-d0326b425dee.png",
    "shop_bg_sushi.png":    "https://ppy-test.tos-cn-beijing.volces.com/ffassets/bbb1829c-f6c3-478e-a38c-209b16b5ebd9.png",
    "shop_bg_hotpot.png":   "https://ppy-test.tos-cn-beijing.volces.com/ffassets/b26a4e0a-dab8-4fe5-aa8a-87ea81cbbf4e.png",
    "shop_bg_coffee.png":   "https://ppy-test.tos-cn-beijing.volces.com/ffassets/b37e5bda-422f-4960-af4b-cfd8078f52b8.png",
    "shop_bg_icecream.png": "https://ppy-test.tos-cn-beijing.volces.com/ffassets/ab691f72-d973-4953-ac97-153f2f4b31f3.png",
    "shop_bg_chicken.png":  "https://ppy-test.tos-cn-beijing.volces.com/ffassets/27065a81-ad81-4f98-b4ef-545e7e2aeaed.png",
    "shop_bg_donut.png":    "https://ppy-test.tos-cn-beijing.volces.com/ffassets/1f2b4103-6408-421d-a074-84887c090092.png",
    "facade_1.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/2bb3b8f2-38db-466a-91c3-4ac9746a850f.png",
    "facade_2.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/c65ae4ef-55a3-4220-aa0d-02a83f1e8c21.png",
    "facade_3.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/eacd0a8d-7ded-40bb-852c-5155331ef77c.png",
    "facade_4.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/31d1c5c6-e0c6-4662-ae9e-4ef654c9d21d.png",
    "facade_5.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/05e58e2e-6b84-4657-99f4-4ff7a22c9484.png",
    "facade_6.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/d7e43656-da0e-4783-b6dc-104f1287b87e.png",
    "facade_7.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/01269c24-c8ac-4fc9-bf42-46da10c03005.png",
    "facade_8.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/36963631-2287-4dc9-9ead-98e4217a983b.png",
    "facade_9.png":         "https://ppy-test.tos-cn-beijing.volces.com/ffassets/ce1eb6b2-a021-46f1-b51f-67dfd1df389f.png",
}

with open(SRC, "r", encoding="utf-8") as f:
    html = f.read()

# 安全校验：源文件里到底引用了哪些 assets/ 文件名
referenced = set(re.findall(r"assets/([A-Za-z0-9_\-]+\.png)", html))
missing = referenced - set(MAP.keys())
if missing:
    raise SystemExit("ERROR: 以下被引用的资源不在 TOS 映射表中，无法改写: " + ", ".join(sorted(missing)))

# 逐文件替换（完整文件名做精确替换，避免前缀误伤）
replaced = 0
for name, url in MAP.items():
    token = "assets/" + name
    n = html.count(token)
    if n:
        html = html.replace(token, url)
        replaced += n

os.makedirs(DST_DIR, exist_ok=True)
with open(DST, "w", encoding="utf-8") as f:
    f.write(html)

# 再次校验：改写后不应再残留任何本地 assets/ 引用
leftover = re.findall(r"assets/([A-Za-z0-9_\-]+\.png)", html)
print(f"referenced unique assets : {len(referenced)}")
print(f"replaced token occurrences: {replaced}")
print(f"leftover local refs       : {len(leftover)} -> {sorted(set(leftover))}")
print(f"dist written              : {DST}  ({os.path.getsize(DST)} bytes)")
