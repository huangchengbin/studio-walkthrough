"""生成劳模室墙面贴图（A 面壁画 / B 面标题带 / C 面荣誉标题 / F 面简介墙）。

素材来源：
- A 面：V07 已切好的壁画图（source/data/scene.gz 的 textures.mural）
- B/C/F：按现场照片中的标题、配色重绘（示意版，非照片矫正）

输出：web/public/assets/textures/*.png|jpg
"""
import pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'web' / 'public' / 'assets' / 'textures'
OUT.mkdir(parents=True, exist_ok=True)

GREEN = (31, 107, 82)
GREEN_DARK = (22, 82, 63)
INK = (35, 40, 45)

FONT_BOLD = '/System/Library/Fonts/PingFang.ttc'
FONT_LATIN = '/System/Library/Fonts/Helvetica.ttc'


def font(size, path=FONT_BOLD, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


def tracked(draw, xy, text, f, fill, spacing=0, anchor='la'):
    """逐字绘制以模拟字距（PIL 无 letter-spacing）。"""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill, anchor=anchor)
        w = draw.textlength(ch, font=f)
        x += w + spacing
    return x


def text_width(draw, text, f, spacing=0):
    return sum(draw.textlength(c, font=f) for c in text) + spacing * max(0, len(text) - 1)


# ---------- A 面：壁画（真实素材） ----------
def make_a():
    src = pathlib.Path('/tmp/v07tex/mural.jpg')
    if not src.exists():
        print('skip A: mural.jpg not found (先解压 V07 贴图)')
        return
    im = Image.open(src).convert('RGB')
    target_ratio = 5.05 / 3.25
    w, h = im.size
    if w / h > target_ratio:
        nw = int(h * target_ratio)
        im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    else:
        nh = int(w / target_ratio)
        im = im.crop((0, 0, w, nh))
    im = im.resize((2400, int(2400 / target_ratio)), Image.LANCZOS)
    im.save(OUT / 'wall_a_mural.jpg', quality=86)
    print('A mural', im.size)


# ---------- B 面：绿色标题带（透明底） ----------
def make_b():
    W, H = 2200, 300
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f_cn = font(150)
    f_en = font(34, FONT_LATIN)
    cn = '创新成果展'
    en = 'CHUANGXIN CHENGGUO ZHAN'
    wcn = text_width(d, cn, f_cn, 14)
    x = (W - wcn) / 2
    y = 30
    for ch in cn:
        d.text((x, y), ch, font=f_cn, fill=GREEN, anchor='la')
        x += d.textlength(ch, font=f_cn) + 14
    wen = text_width(d, en, f_en, 6)
    x = (W - wen) / 2
    tracked(d, (x, 212), en, f_en, GREEN_DARK, 6)
    im.save(OUT / 'wall_b_title.png')
    print('B title', im.size)


# ---------- C 面：荣誉展示标题（透明底） ----------
def make_c():
    W, H = 1600, 320
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f_cn = font(150)
    f_en = font(30, FONT_LATIN)
    cn = '荣誉展示'
    en = 'RONGYU  ZHANSHI'
    wcn = text_width(d, cn, f_cn, 16)
    x = (W - wcn) / 2
    for ch in cn:
        d.text((x, 24), ch, font=f_cn, fill=GREEN, anchor='la')
        x += d.textlength(ch, font=f_cn) + 16
    wen = text_width(d, en, f_en, 6)
    tracked(d, ((W - wen) / 2, 216), en, f_en, GREEN_DARK, 6)
    im.save(OUT / 'wall_c_title.png')
    print('C title', im.size)


# ---------- F 面：简介墙整体版式 ----------
def make_f():
    W, H = 2600, 1270  # 5.5 : 2.7
    im = Image.new('RGB', (W, H), (252, 252, 252))
    d = ImageDraw.Draw(im)

    # 绿色 S 形色块（右半）
    sweep = [
        (W * 0.42, 0), (W, 0), (W, H), (W * 0.30, H),
        (W * 0.40, H * 0.72), (W * 0.62, H * 0.42), (W * 0.55, H * 0.12),
    ]
    d.polygon(sweep, fill=GREEN)

    # 国家电网标识（文字近似）
    f_logo_cn = font(72)
    f_logo_en = font(26, FONT_LATIN)
    lx, ly = W * 0.60, H * 0.075
    d.ellipse([lx, ly + 6, lx + 74, ly + 80], outline=INK, width=5)
    d.ellipse([lx + 20, ly + 26, lx + 54, ly + 60], outline=INK, width=4)
    tracked(d, (lx + 96, ly + 4), '国家电网', f_logo_cn, INK, 8)
    tracked(d, (lx + 100, ly + 84), 'STATE GRID', f_logo_en, INK, 6)

    # 主标题（白色）
    f_big = font(120)
    f_py = font(30, FONT_LATIN)
    title = '创新工作室简介'
    tw = text_width(d, title, f_big, 10)
    tx = W * 0.575
    for ch in title:
        d.text((tx, H * 0.245), ch, font=f_big, fill=(255, 255, 255), anchor='la')
        tx += d.textlength(ch, font=f_big) + 10
    tracked(d, (W * 0.575, H * 0.245 + 140), 'CHUANG XIN GONG ZUO SHI JIAN JIE',
            f_py, (232, 242, 238), 5)

    # 正文示意：细线（不编造文字）
    for i in range(9):
        y = H * 0.50 + i * 34
        w = (W * 0.90 - W * 0.585) * (0.96 if i % 3 else 0.8)
        d.rounded_rectangle([W * 0.585, y, W * 0.585 + w, y + 9], radius=4,
                            fill=(214, 228, 222))

    # 左侧小标题
    f_sub = font(70)
    f_sub_py = font(24, FONT_LATIN)
    tracked(d, (W * 0.045, H * 0.085), '领军人物介绍', f_sub, GREEN, 8)
    tracked(d, (W * 0.048, H * 0.085 + 84), 'LING JUN REN WU JIE SHAO',
            f_sub_py, GREEN_DARK, 4)

    # 人物卡占位（5 张，白底细边 + 灰色头像块 + 说明线）
    card_w, card_h = W * 0.175, H * 0.30
    positions = [(0.045, 0.30), (0.245, 0.30), (0.045, 0.63), (0.245, 0.63), (0.445, 0.63)]
    for idx, (px, py) in enumerate(positions):
        x0, y0 = W * px, H * py
        d.rounded_rectangle([x0, y0, x0 + card_w, y0 + card_h], radius=12,
                            fill=(255, 255, 255), outline=(216, 222, 226), width=3)
        d.rounded_rectangle([x0 + 14, y0 + 14, x0 + card_w * 0.46, y0 + card_h - 52],
                            radius=8, fill=(208, 214, 220))
        for i in range(4):
            ly2 = y0 + 22 + i * 22
            d.rounded_rectangle([x0 + card_w * 0.5, ly2, x0 + card_w - 18, ly2 + 8],
                                radius=3, fill=(210, 216, 221))
        d.rounded_rectangle([x0 + 14, y0 + card_h - 40, x0 + card_w - 14, y0 + card_h - 12],
                            radius=6, fill=GREEN)

    im.save(OUT / 'wall_f_intro.jpg', quality=88)
    print('F intro', im.size)


if __name__ == '__main__':
    make_a()
    make_b()
    make_c()
    make_f()
    print('textures ->', OUT)
