"""Generate Chrome Web Store promo screenshots for the `inkling` extension.

Output: 5 PNGs at 1280x800, 24-bit RGB (no alpha).
Pipeline: build SVG strings -> cairosvg -> PNG -> PIL flatten to RGB -> save.
"""

from __future__ import annotations

import base64
import os
from pathlib import Path

import cairosvg
from PIL import Image

W, H = 1280, 800
HERE = Path("/sessions/youthful-beautiful-euler/mnt/outputs")
ICON_PATH = HERE / "icon-128.png"


# -- color helpers ----------------------------------------------------------

def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    if len(h) in (3, 4):
        h = "".join(c * 2 for c in h[:3])
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = (c / 255 for c in rgb)
    def f(x: float) -> float:
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contrast_for(bg_hex: str) -> str:
    return "#111111" if luminance(hex_to_rgb(bg_hex)) > 0.45 else "#ffffff"


# -- SVG helpers ------------------------------------------------------------

ICON_B64 = base64.b64encode(ICON_PATH.read_bytes()).decode()
ICON_HREF = f"data:image/png;base64,{ICON_B64}"


def header_brand(x: int, y: int, size: int = 56, sub: str | None = None) -> str:
    """Icon + 'inkling' wordmark, top-left brand block."""
    icon_size = size
    text_x = x + icon_size + 18
    text_y = y + icon_size * 0.78
    parts = [
        f'<image href="{ICON_HREF}" x="{x}" y="{y}" width="{icon_size}" height="{icon_size}" />',
        (
            f'<text x="{text_x}" y="{text_y}" '
            f'font-family="Inter, DejaVu Sans, sans-serif" font-size="{int(size*0.78)}" '
            f'font-weight="700" fill="#1a1330" letter-spacing="-1">inkling</text>'
        ),
    ]
    if sub:
        parts.append(
            f'<text x="{text_x}" y="{text_y + 26}" '
            f'font-family="Inter, DejaVu Sans, sans-serif" font-size="15" '
            f'fill="#5a5577">{sub}</text>'
        )
    return "\n".join(parts)


def svg_open(bg_top: str = "#f4f1ff", bg_bot: str = "#fdfdff") -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{bg_top}"/>
      <stop offset="1" stop-color="{bg_bot}"/>
    </linearGradient>
    <linearGradient id="cardgrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#fafaff"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="cardshadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#1a1330" flood-opacity="0.10"/>
    </filter>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
'''


def svg_close() -> str:
    return "</svg>"


def chip_bg(text: str, color: str, x: int, y: int, font_size: int = 22, pad_x: int = 10, pad_y: int = 4) -> tuple[str, int]:
    """Color value highlighted background-mode style. Returns (svg, width)."""
    text_color = contrast_for(color)
    # estimate width: mono char ~ 0.6 * font_size
    width = int(len(text) * font_size * 0.6) + pad_x * 2
    height = font_size + pad_y * 2
    s = (
        f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="4" fill="{color}"/>'
        f'<text x="{x + pad_x}" y="{y + pad_y + font_size - 4}" '
        f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{font_size}" '
        f'fill="{text_color}">{text}</text>'
    )
    return s, width


def chip_marker(text: str, color: str, x: int, y: int, font_size: int = 22) -> tuple[str, int]:
    sq = int(font_size * 0.75)
    text_w = int(len(text) * font_size * 0.6)
    total = sq + 8 + text_w
    s = (
        f'<rect x="{x}" y="{y + (font_size - sq)//2 + 2}" width="{sq}" height="{sq}" rx="2" fill="{color}"/>'
        f'<text x="{x + sq + 8}" y="{y + font_size}" '
        f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{font_size}" fill="#1a1330">{text}</text>'
    )
    return s, total


def chip_fg(text: str, color: str, x: int, y: int, font_size: int = 22) -> tuple[str, int]:
    w = int(len(text) * font_size * 0.6)
    s = (
        f'<text x="{x}" y="{y + font_size}" '
        f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{font_size}" '
        f'font-weight="600" fill="{color}">{text}</text>'
    )
    return s, w


def chip_underline(text: str, color: str, x: int, y: int, font_size: int = 22) -> tuple[str, int]:
    w = int(len(text) * font_size * 0.6)
    s = (
        f'<text x="{x}" y="{y + font_size}" '
        f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{font_size}" fill="#1a1330">{text}</text>'
        f'<rect x="{x}" y="{y + font_size + 3}" width="{w}" height="3" fill="{color}"/>'
    )
    return s, w


def chip_dot(text: str, color: str, x: int, y: int, font_size: int = 22) -> tuple[str, int]:
    w = int(len(text) * font_size * 0.6)
    r = int(font_size * 0.32)
    s = (
        f'<text x="{x}" y="{y + font_size}" '
        f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{font_size}" fill="#1a1330">{text}</text>'
        f'<circle cx="{x + w + r + 6}" cy="{y + font_size - r - 2}" r="{r}" fill="{color}"/>'
    )
    return s, w + 6 + r * 2


def chip_outline(text: str, color: str, x: int, y: int, font_size: int = 22, pad_x: int = 8, pad_y: int = 3) -> tuple[str, int]:
    width = int(len(text) * font_size * 0.6) + pad_x * 2
    height = font_size + pad_y * 2
    s = (
        f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="3" '
        f'fill="none" stroke="{color}" stroke-width="2"/>'
        f'<text x="{x + pad_x}" y="{y + pad_y + font_size - 4}" '
        f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{font_size}" fill="#1a1330">{text}</text>'
    )
    return s, width


# -- screenshot 1: hero -----------------------------------------------------

def shot_hero() -> str:
    s = [svg_open("#eef0ff", "#fbfaff")]
    # soft decorative blobs
    s.append('<circle cx="1120" cy="140" r="180" fill="#a78bfa" opacity="0.18" filter="url(#soft)"/>')
    s.append('<circle cx="200" cy="720" r="220" fill="#60a5fa" opacity="0.18" filter="url(#soft)"/>')

    s.append(header_brand(70, 60, 64))

    # headline
    s.append(
        '<text x="70" y="290" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="64" font-weight="800" fill="#1a1330" letter-spacing="-2">'
        'Color codes,</text>'
    )
    s.append(
        '<text x="70" y="362" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="64" font-weight="800" fill="#1a1330" letter-spacing="-2">'
        'visualized in place.</text>'
    )
    s.append(
        '<text x="70" y="412" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="22" font-weight="400" fill="#5a5577">'
        'Hex, RGB, HSL — highlighted right inside every page you read.</text>'
    )

    # showcase code card
    cx, cy, cw, ch = 70, 470, 1140, 270
    s.append(f'<rect x="{cx}" y="{cy}" width="{cw}" height="{ch}" rx="16" fill="url(#cardgrad)" filter="url(#cardshadow)"/>')
    # window dots
    s.append(f'<circle cx="{cx+24}" cy="{cy+24}" r="6" fill="#ff5f56"/>')
    s.append(f'<circle cx="{cx+44}" cy="{cy+24}" r="6" fill="#ffbd2e"/>')
    s.append(f'<circle cx="{cx+64}" cy="{cy+24}" r="6" fill="#27c93f"/>')
    s.append(
        f'<text x="{cx+100}" y="{cy+30}" font-family="Inter, DejaVu Sans, sans-serif" font-size="13" fill="#8a85a3">styles.css</text>'
    )

    # code lines: label + highlighted chip
    code_x = cx + 36
    line_y = cy + 76
    fs = 26
    rows = [
        ("--primary:", "#3498db"),
        ("--accent:",  "#e74c3c"),
        ("--warning:", "#f1c40f"),
        ("--mint:",    "#1abc9c"),
        ("--violet:",  "#9b59b6"),
    ]
    for label, hex_v in rows:
        s.append(
            f'<text x="{code_x}" y="{line_y + fs - 4}" '
            f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{fs}" fill="#5a5577">{label}</text>'
        )
        chip, _ = chip_bg(hex_v, hex_v, code_x + 220, line_y, font_size=fs)
        s.append(chip)
        s.append(
            f'<text x="{code_x + 220 + 170}" y="{line_y + fs - 4}" '
            f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="{fs}" fill="#5a5577">;</text>'
        )
        line_y += 38

    s.append(svg_close())
    return "".join(s)


# -- screenshot 2: six modes ------------------------------------------------

def shot_modes() -> str:
    s = [svg_open("#fef7f0", "#fdfdff")]
    s.append('<circle cx="1180" cy="80" r="160" fill="#fbbf24" opacity="0.15" filter="url(#soft)"/>')
    s.append('<circle cx="120" cy="780" r="200" fill="#34d399" opacity="0.13" filter="url(#soft)"/>')

    s.append(header_brand(70, 60, 56))
    s.append(
        '<text x="70" y="220" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="48" font-weight="800" fill="#1a1330" letter-spacing="-1">'
        'Six display modes —</text>'
    )
    s.append(
        '<text x="70" y="275" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="48" font-weight="800" fill="#1a1330" letter-spacing="-1">'
        'mix and match.</text>'
    )

    # grid 3x2 of mode cards
    color = "#3498db"
    sample = "#3498db"
    cards = [
        ("Background", chip_bg),
        ("Foreground", chip_fg),
        ("Marker",     chip_marker),
        ("Underline",  chip_underline),
        ("Dot",        chip_dot),
        ("Outline",    chip_outline),
    ]
    cw, chh = 360, 200
    gap_x, gap_y = 30, 30
    grid_x = 70
    grid_y = 340
    for i, (name, fn) in enumerate(cards):
        col = i % 3
        row = i // 3
        x = grid_x + col * (cw + gap_x)
        y = grid_y + row * (chh + gap_y)
        s.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{chh}" rx="14" fill="#ffffff" filter="url(#cardshadow)"/>')
        s.append(
            f'<text x="{x + 24}" y="{y + 40}" font-family="Inter, DejaVu Sans, sans-serif" '
            f'font-size="14" font-weight="700" fill="#9089ab" letter-spacing="1">'
            f'{name.upper()}</text>'
        )
        # mode sample
        chip, _ = fn(sample, color, x + 24, y + 80, font_size=32)
        s.append(chip)
        # secondary line — short description
        descs = {
            "Background": "Fill behind the value",
            "Foreground": "Paint the text",
            "Marker":     "Tag before the value",
            "Underline":  "Thick colored rule",
            "Dot":        "Trailing circle",
            "Outline":    "Crisp colored border",
        }
        s.append(
            f'<text x="{x + 24}" y="{y + chh - 26}" font-family="Inter, DejaVu Sans, sans-serif" '
            f'font-size="15" fill="#6b6688">{descs[name]}</text>'
        )

    s.append(svg_close())
    return "".join(s)


# -- screenshot 3: formats --------------------------------------------------

def shot_formats() -> str:
    s = [svg_open("#eef5ff", "#fdfdff")]
    s.append('<circle cx="1180" cy="780" r="220" fill="#60a5fa" opacity="0.15" filter="url(#soft)"/>')
    s.append('<circle cx="80" cy="80" r="160" fill="#c084fc" opacity="0.15" filter="url(#soft)"/>')

    s.append(header_brand(70, 60, 56))
    s.append(
        '<text x="70" y="220" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="48" font-weight="800" fill="#1a1330" letter-spacing="-1">'
        'Every CSS color, recognized.</text>'
    )
    s.append(
        '<text x="70" y="262" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="20" fill="#5a5577">'
        'Hex, RGB, HSL — legacy and modern syntax, including alpha.</text>'
    )

    # big card listing
    cx, cy, cw, ch = 70, 310, 1140, 430
    s.append(f'<rect x="{cx}" y="{cy}" width="{cw}" height="{ch}" rx="16" fill="#ffffff" filter="url(#cardshadow)"/>')

    rows = [
        ("Hex 3/4-digit",   [("#fff", "#fff"), ("#f00", "#f00"), ("#0f0", "#0f0"), ("#f0a8", "#f0a8")]),
        ("Hex 6/8-digit",   [("#3498db", "#3498db"), ("#e74c3c", "#e74c3c"), ("#1abc9c", "#1abc9c"), ("#9b59b680", "#9b59b680")]),
        ("RGB / RGBA",      [("rgb(231, 76, 60)", "#e74c3c"), ("rgb(46 204 113)", "#2ecc71"), ("rgba(52, 152, 219, 0.6)", "#3498db99")]),
        ("HSL / HSLA",      [("hsl(48, 100%, 50%)", "#ffcc00"), ("hsl(280 80% 60%)", "#b85ce6"), ("hsla(200, 80%, 50%, 0.7)", "#1a99e6b3")]),
    ]
    row_x = cx + 36
    row_y = cy + 30
    label_w = 220
    for label, items in rows:
        s.append(
            f'<text x="{row_x}" y="{row_y + 30}" font-family="Inter, DejaVu Sans, sans-serif" '
            f'font-size="15" font-weight="700" fill="#9089ab" letter-spacing="0.5">'
            f'{label.upper()}</text>'
        )
        x = row_x + label_w
        for text, color in items:
            chip, w = chip_bg(text, color, x, row_y + 6, font_size=24)
            s.append(chip)
            x += w + 18
        row_y += 95
        if label != rows[-1][0]:
            s.append(f'<line x1="{row_x}" y1="{row_y - 10}" x2="{cx + cw - 36}" y2="{row_y - 10}" stroke="#eceaf6" stroke-width="1"/>')

    s.append(svg_close())
    return "".join(s)


# -- screenshot 4: popup ----------------------------------------------------

def shot_popup() -> str:
    s = [svg_open("#f4f0ff", "#fdfdff")]
    s.append('<circle cx="1180" cy="120" r="220" fill="#a78bfa" opacity="0.18" filter="url(#soft)"/>')
    s.append('<circle cx="120" cy="780" r="200" fill="#60a5fa" opacity="0.15" filter="url(#soft)"/>')

    s.append(header_brand(70, 60, 56))
    s.append(
        '<text x="70" y="220" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="48" font-weight="800" fill="#1a1330" letter-spacing="-1">'
        'One click to tweak.</text>'
    )
    s.append(
        '<text x="70" y="262" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="20" fill="#5a5577">'
        'Pick modes, toggle the site, or hit Alt+Shift+C — no reload needed.</text>'
    )

    # popup card (resembles the real popup, scaled up)
    pw, ph = 460, 440
    px, py = 110, 320
    s.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="14" fill="#ffffff" filter="url(#cardshadow)"/>')

    # popup header
    s.append(
        f'<text x="{px + 28}" y="{py + 48}" font-family="Inter, DejaVu Sans, sans-serif" '
        f'font-size="26" font-weight="800" fill="#1a1330">inkling</text>'
    )
    # toggle (on)
    tx, ty = px + pw - 132, py + 28
    s.append(f'<rect x="{tx}" y="{ty}" width="44" height="22" rx="11" fill="#6c5ce7"/>')
    s.append(f'<circle cx="{tx + 33}" cy="{ty + 11}" r="9" fill="#ffffff"/>')
    s.append(
        f'<text x="{tx + 54}" y="{ty + 17}" font-family="Inter, DejaVu Sans, sans-serif" '
        f'font-size="14" fill="#1a1330">Enabled</text>'
    )

    # section title
    s.append(
        f'<text x="{px + 28}" y="{py + 96}" font-family="Inter, DejaVu Sans, sans-serif" '
        f'font-size="12" font-weight="700" fill="#9089ab" letter-spacing="1">DISPLAY MODES</text>'
    )

    # six rows mimicking the popup checkboxes
    modes = [
        ("Background", chip_bg,       True),
        ("Foreground", chip_fg,       False),
        ("Marker",     chip_marker,   True),
        ("Underline",  chip_underline,False),
        ("Dot",        chip_dot,      False),
        ("Outline",    chip_outline,  False),
    ]
    color = "#3498db"
    row_y = py + 116
    for name, fn, checked in modes:
        # checkbox
        bx, by = px + 28, row_y + 6
        if checked:
            s.append(f'<rect x="{bx}" y="{by}" width="16" height="16" rx="3" fill="#6c5ce7"/>')
            s.append(f'<path d="M{bx+3.5} {by+8.5} L{bx+7} {by+12} L{bx+13} {by+5}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
        else:
            s.append(f'<rect x="{bx}" y="{by}" width="16" height="16" rx="3" fill="none" stroke="#cfcbe2" stroke-width="1.5"/>')

        chip, _ = fn(color, color, bx + 32, row_y, font_size=18)
        s.append(chip)
        s.append(
            f'<text x="{px + pw - 116}" y="{row_y + 18}" font-family="Inter, DejaVu Sans, sans-serif" '
            f'font-size="14" fill="#6b6688">{name}</text>'
        )
        row_y += 36

    # divider
    s.append(f'<line x1="{px + 28}" y1="{row_y + 4}" x2="{px + pw - 28}" y2="{row_y + 4}" stroke="#eceaf6" stroke-width="1"/>')
    # disable on this site
    bx, by = px + 28, row_y + 22
    s.append(f'<rect x="{bx}" y="{by}" width="16" height="16" rx="3" fill="none" stroke="#cfcbe2" stroke-width="1.5"/>')
    s.append(
        f'<text x="{bx + 26}" y="{by + 13}" font-family="Inter, DejaVu Sans, sans-serif" '
        f'font-size="14" fill="#1a1330">Disable on this site</text>'
    )

    # annotations on the right
    ann_x = 660
    ann_items = [
        ("One-click on/off",     "Toggle the whole extension instantly."),
        ("Combine display modes","Stack background + marker + underline."),
        ("Per-domain disable",   "Quiet inkling on sites where you don't want it."),
        ("Alt+Shift+C shortcut", "Toggle without opening the popup."),
    ]
    ay = 340
    for title, body in ann_items:
        # bullet
        s.append(f'<circle cx="{ann_x + 8}" cy="{ay + 8}" r="6" fill="#6c5ce7"/>')
        s.append(
            f'<text x="{ann_x + 28}" y="{ay + 14}" font-family="Inter, DejaVu Sans, sans-serif" '
            f'font-size="22" font-weight="700" fill="#1a1330">{title}</text>'
        )
        s.append(
            f'<text x="{ann_x + 28}" y="{ay + 42}" font-family="Inter, DejaVu Sans, sans-serif" '
            f'font-size="16" fill="#5a5577">{body}</text>'
        )
        ay += 80

    s.append(svg_close())
    return "".join(s)


# -- screenshot 5: before / after ------------------------------------------

def shot_compare() -> str:
    s = [svg_open("#f0f7ff", "#fdfdff")]
    s.append('<circle cx="120" cy="100" r="180" fill="#60a5fa" opacity="0.15" filter="url(#soft)"/>')
    s.append('<circle cx="1160" cy="760" r="220" fill="#f472b6" opacity="0.15" filter="url(#soft)"/>')

    s.append(header_brand(70, 60, 56))
    s.append(
        '<text x="70" y="220" font-family="Inter, DejaVu Sans, sans-serif" '
        'font-size="48" font-weight="800" fill="#1a1330" letter-spacing="-1">'
        'Same page. Way more readable.</text>'
    )

    # two browser cards
    card_w = 555
    card_h = 480
    gap = 30
    left_x = 70
    right_x = left_x + card_w + gap
    card_y = 270

    rows = [
        ("--primary:",  "#3498db"),
        ("--accent:",   "#e74c3c"),
        ("--warning:",  "#f1c40f"),
        ("--mint:",     "#1abc9c"),
        ("--violet:",   "#9b59b6"),
        ("--rose:",     "#e84393"),
        ("--sky:",      "#74b9ff"),
        ("--ink:",      "#34495e"),
    ]

    def draw_browser(x: int, y: int, label: str, label_color: str, highlight: bool):
        out = []
        out.append(f'<rect x="{x}" y="{y}" width="{card_w}" height="{card_h}" rx="14" fill="#ffffff" filter="url(#cardshadow)"/>')
        # title bar
        out.append(f'<rect x="{x}" y="{y}" width="{card_w}" height="44" rx="14" fill="#f5f3fb"/>')
        out.append(f'<rect x="{x}" y="{y+30}" width="{card_w}" height="14" fill="#f5f3fb"/>')
        out.append(f'<circle cx="{x+20}" cy="{y+22}" r="5" fill="#ff5f56"/>')
        out.append(f'<circle cx="{x+38}" cy="{y+22}" r="5" fill="#ffbd2e"/>')
        out.append(f'<circle cx="{x+56}" cy="{y+22}" r="5" fill="#27c93f"/>')
        # url pill
        out.append(f'<rect x="{x+80}" y="{y+12}" width="{card_w-160}" height="20" rx="10" fill="#ebe7f7"/>')
        out.append(f'<text x="{x+96}" y="{y+27}" font-family="DejaVu Sans Mono, Menlo, monospace" font-size="12" fill="#6b6688">design-tokens.css</text>')
        # tag label
        out.append(f'<rect x="{x+card_w-72}" y="{y+12}" width="60" height="20" rx="10" fill="{label_color}"/>')
        out.append(f'<text x="{x+card_w-42}" y="{y+27}" font-family="Inter, DejaVu Sans, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">{label}</text>')

        # code area
        cy = y + 70
        for label_text, hex_v in rows:
            out.append(
                f'<text x="{x + 30}" y="{cy + 22}" '
                f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="22" fill="#5a5577">{label_text}</text>'
            )
            if highlight:
                chip, _ = chip_bg(hex_v, hex_v, x + 220, cy, font_size=22)
                out.append(chip)
            else:
                out.append(
                    f'<text x="{x + 220}" y="{cy + 22}" '
                    f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="22" fill="#1a1330">{hex_v}</text>'
                )
            out.append(
                f'<text x="{x + 380}" y="{cy + 22}" '
                f'font-family="DejaVu Sans Mono, Menlo, monospace" font-size="22" fill="#5a5577">;</text>'
            )
            cy += 50
        return "".join(out)

    s.append(draw_browser(left_x,  card_y, "BEFORE", "#9089ab", highlight=False))
    s.append(draw_browser(right_x, card_y, "AFTER",  "#6c5ce7", highlight=True))

    s.append(svg_close())
    return "".join(s)


# -- render pipeline --------------------------------------------------------

def render(svg_str: str, out_path: Path) -> None:
    # cairosvg -> RGBA PNG bytes
    import io
    png_bytes = cairosvg.svg2png(bytestring=svg_str.encode("utf-8"),
                                 output_width=W, output_height=H)
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    # flatten onto white -> 24-bit RGB (no alpha)
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[3])
    bg.save(out_path, "PNG", optimize=True)


def main() -> None:
    shots = [
        ("inkling-1-hero.png",    shot_hero),
        ("inkling-2-modes.png",   shot_modes),
        ("inkling-3-formats.png", shot_formats),
        ("inkling-4-popup.png",   shot_popup),
        ("inkling-5-compare.png", shot_compare),
    ]
    for name, fn in shots:
        out = HERE / name
        render(fn(), out)
        with Image.open(out) as im:
            print(f"{name}  size={im.size}  mode={im.mode}")


if __name__ == "__main__":
    main()
