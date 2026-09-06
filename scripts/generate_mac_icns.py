#!/usr/bin/env python3
"""
AI Secure Space - macOS Apple Icon (.icns) Generator
Creates a high-resolution cyber shield icon and packs it into Apple's standard
multi-resolution .icns container (16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024 Retina).
"""

import sys
import os
import io
import struct
from PIL import Image, ImageDraw

def render_cyber_shield_icon(size=1024):
    """Renders the AI Secure Space high-resolution master icon."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # 1. Outer Squircle / Rounded Badge Background (#020617)
    margin = int(size * 0.0625) # 64px at 1024
    radius = int(size * 0.175)  # 180px at 1024
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(2, 6, 23, 255),
        outline=(56, 189, 248, 255),
        width=int(size * 0.02) # 20px
    )

    # 2. Inner Glowing Accent Ring (#1e293b)
    inner_margin = margin + int(size * 0.04)
    inner_radius = int(radius * 0.8)
    draw.rounded_rectangle(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        radius=inner_radius,
        fill=(15, 23, 42, 255),
        outline=(168, 85, 247, 180),
        width=int(size * 0.008)
    )

    # 3. Cyber Security Shield (Hexagonal Polygon)
    cx, cy = size // 2, size // 2
    sw = int(size * 0.28) # Shield half-width
    sh = int(size * 0.32) # Shield half-height
    
    shield_pts = [
        (cx, cy - sh),                    # Top center apex
        (cx + sw, cy - int(sh * 0.65)),   # Top right shoulder
        (cx + sw, cy + int(sh * 0.25)),   # Mid right flank
        (cx, cy + sh),                    # Bottom center point
        (cx - sw, cy + int(sh * 0.25)),   # Mid left flank
        (cx - sw, cy - int(sh * 0.65))    # Top left shoulder
    ]
    draw.polygon(
        shield_pts,
        fill=(11, 15, 25, 255),
        outline=(56, 189, 248, 255)
    )

    # 4. Neon Cyan / Violet Checkmark Core
    # Points: left start -> vertex -> top right tip
    check_pts = [
        (cx - int(sw * 0.45), cy + int(sh * 0.05)),
        (cx - int(sw * 0.1), cy + int(sh * 0.35)),
        (cx + int(sw * 0.5), cy - int(sh * 0.3))
    ]
    draw.line(check_pts, fill=(56, 189, 248, 255), width=int(size * 0.032), joint='curve')

    # Draw neon highlight circles at vertexes
    r_dot = int(size * 0.016)
    for px, py in check_pts:
        draw.ellipse([px - r_dot, py - r_dot, px + r_dot, py + r_dot], fill=(168, 85, 247, 255))

    return im

def build_icns_file(output_path):
    """Encodes the master icon into an Apple .icns binary."""
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    master = render_cyber_shield_icon(1024)

    def png_bytes(res):
        resized = master.resize((res, res), Image.Resampling.LANCZOS)
        bio = io.BytesIO()
        resized.save(bio, format='PNG', optimize=True)
        return bio.getvalue()

    # Standard Apple ICNS Resolution Tags:
    # ic10: 1024x1024 (512x512@2x Retina)
    # ic09: 512x512
    # ic08: 256x256
    # ic07: 128x128
    entries = [
        (b'ic10', png_bytes(1024)),
        (b'ic09', png_bytes(512)),
        (b'ic08', png_bytes(256)),
        (b'ic07', png_bytes(128)),
    ]

    body = b''
    for ostype, data in entries:
        # Each block: 4 bytes tag + 4 bytes total length (including 8-byte header) + payload
        block_len = len(data) + 8
        body += ostype + struct.pack('>I', block_len) + data

    total_len = len(body) + 8
    header = b'icns' + struct.pack('>I', total_len)
    
    with open(output_path, 'wb') as f:
        f.write(header + body)

    print(f"[+] Apple .icns created: {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    dest = sys.argv[1] if len(sys.argv) > 1 else 'dist/app.icns'
    build_icns_file(dest)
