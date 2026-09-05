"""
generate_samples.py
-------------------
Generates realistic multi-spectral and SAR synthetic remote-sensing imagery
and GeoTIFFs for all 5 mandatory Smart India Hackathon (SIH26167) evaluation demos.
"""

import os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SAMPLES_DIR = Path(__file__).resolve().parent / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

def generate_demo1_optical_scene():
    """Demo 1: Single Optical scene for Land Cover Classification & VQA."""
    w, h = 512, 512
    img = Image.new("RGB", (w, h), (46, 125, 50))  # Forest base green
    draw = ImageDraw.Draw(img)

    # Agriculture parcel grids (light yellow/green)
    for x in range(20, 220, 40):
        for y in range(20, 220, 40):
            color = (139 + (x % 30), 195 - (y % 20), 74)
            draw.rectangle([x, y, x + 35, y + 35], fill=color, outline=(76, 175, 80))

    # Winding river (blue)
    points = [
        (260, 0), (280, 80), (320, 160), (310, 240),
        (350, 320), (390, 400), (430, 512)
    ]
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=(30, 136, 229), width=28)

    # Urban settlement (grey clusters with red/white roofs)
    draw.rectangle([280, 320, 500, 500], fill=(120, 125, 130))
    for bx in range(290, 490, 25):
        for by in range(330, 490, 25):
            roof_color = (200, 70, 60) if (bx + by) % 2 == 0 else (220, 220, 220)
            draw.rectangle([bx, by, bx + 18, by + 18], fill=roof_color, outline=(60, 60, 60))

    img = img.filter(ImageFilter.GaussianBlur(0.6))
    out_path = SAMPLES_DIR / "optical_single.png"
    img.save(out_path)
    print(f"Generated: {out_path.name}")

def generate_demo2_grounding_scene():
    """Demo 2: Text-guided Grounding scene with clear water bodies and runway."""
    w, h = 512, 512
    img = Image.new("RGB", (w, h), (60, 140, 65))
    draw = ImageDraw.Draw(img)

    # Runway / Airport corridor
    draw.rectangle([50, 240, 460, 275], fill=(50, 50, 50), outline=(90, 90, 90))
    for mark in range(70, 440, 30):
        draw.line([(mark, 257), (mark + 15, 257)], fill=(255, 255, 255), width=2)

    # Distinct Lake / Water Reservoir (Target 1)
    draw.ellipse([80, 50, 220, 180], fill=(25, 118, 210), outline=(21, 101, 192), width=2)

    # Secondary Small Pond (Target 2)
    draw.ellipse([340, 80, 420, 150], fill=(25, 118, 210), outline=(21, 101, 192), width=2)

    # Industrial/Commercial Warehouse Blocks (Target 3)
    warehouses = [(80, 340, 200, 450), (240, 350, 360, 460), (380, 330, 480, 420)]
    for wb in warehouses:
        draw.rectangle(wb, fill=(180, 185, 190), outline=(80, 80, 80), width=2)
        # Add rooftop solar or structure texture
        draw.rectangle([wb[0] + 5, wb[1] + 5, wb[2] - 5, wb[3] - 5], fill=(140, 145, 155))

    img = img.filter(ImageFilter.GaussianBlur(0.5))
    out_path = SAMPLES_DIR / "grounding_scene.png"
    img.save(out_path)
    print(f"Generated: {out_path.name}")

def generate_demo3_4_temporal_pair():
    """Demos 3 & 4: Bi-temporal T1 (2021) and T2 (2024) for Change Detection."""
    w, h = 512, 512
    # Base T1 (Pre-expansion & pre-flood)
    t1 = Image.new("RGB", (w, h), (85, 140, 60))
    draw1 = ImageDraw.Draw(t1)

    # Baseline river
    draw1.line([(0, 256), (512, 256)], fill=(33, 150, 243), width=20)

    # Original small town on the north bank
    draw1.rectangle([180, 100, 320, 220], fill=(130, 130, 135))
    for bx in range(190, 310, 20):
        for by in range(110, 210, 20):
            draw1.rectangle([bx, by, bx + 14, by + 14], fill=(210, 80, 70))

    t1 = t1.filter(ImageFilter.GaussianBlur(0.5))
    t1_path = SAMPLES_DIR / "temporal_t1.png"
    t1.save(t1_path)
    print(f"Generated: {t1_path.name}")

    # T2 (2024: Massive urban expansion to South + River overflow / Flood)
    t2 = Image.new("RGB", (w, h), (85, 140, 60))
    draw2 = ImageDraw.Draw(t2)

    # Swollen flooded river
    draw2.line([(0, 256), (512, 256)], fill=(21, 101, 192), width=48)
    draw2.ellipse([140, 220, 260, 320], fill=(25, 118, 210))  # Flood inundation pool

    # Original town
    draw2.rectangle([180, 100, 320, 220], fill=(130, 130, 135))
    for bx in range(190, 310, 20):
        for by in range(110, 210, 20):
            draw2.rectangle([bx, by, bx + 14, by + 14], fill=(210, 80, 70))

    # NEW Urban Expansion Sector (South bank built-up growth)
    draw2.rectangle([140, 350, 380, 480], fill=(140, 140, 145))
    for bx in range(150, 370, 20):
        for by in range(360, 470, 20):
            draw2.rectangle([bx, by, bx + 14, by + 14], fill=(230, 90, 80))

    t2 = t2.filter(ImageFilter.GaussianBlur(0.5))
    t2_path = SAMPLES_DIR / "temporal_t2.png"
    t2.save(t2_path)
    print(f"Generated: {t2_path.name}")

def generate_demo5_optical_sar_pair():
    """Demo 5: Co-registered Optical and SAR pair with cloud cover."""
    w, h = 512, 512
    # 1. Optical scene (Ground features + thick white cloud cover over bottom half)
    opt = Image.new("RGB", (w, h), (55, 130, 60))
    draw_opt = ImageDraw.Draw(opt)

    # Shoreline and Sea/Ocean on right
    draw_opt.rectangle([340, 0, 512, 512], fill=(25, 118, 210))

    # Port docks and ships
    draw_opt.rectangle([300, 120, 360, 150], fill=(160, 160, 165))
    draw_opt.rectangle([300, 240, 360, 270], fill=(160, 160, 165))
    draw_opt.rectangle([300, 360, 360, 390], fill=(160, 160, 165))

    # Dense Urban Core
    draw_opt.rectangle([80, 80, 280, 440], fill=(130, 135, 140))

    # Thick White Cloud Cover obscuring the southern sector (y: 280 to 512)
    cloud_mask = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(cloud_mask)
    c_draw.ellipse([40, 280, 480, 520], fill=(255, 255, 255, 220))
    c_draw.ellipse([180, 240, 420, 450], fill=(255, 255, 255, 200))
    cloud_mask = cloud_mask.filter(ImageFilter.GaussianBlur(15))
    opt.paste(cloud_mask, (0, 0), cloud_mask)

    opt_path = SAMPLES_DIR / "optical_fusion.png"
    opt.save(opt_path)
    print(f"Generated: {opt_path.name}")

    # 2. SAR Scene (Microwave radar penetrative backscatter: clouds invisible!)
    # Water = very dark (specular reflection, low backscatter)
    # Urban/Metal = very bright double-bounce reflection
    sar_arr = np.random.normal(60, 15, (h, w)).clip(20, 100).astype(np.uint8)

    # Water area (black / low backscatter)
    sar_arr[:, 340:] = np.random.normal(15, 5, (h, 512 - 340)).clip(5, 30).astype(np.uint8)

    # Docks & Ships (intense bright double-bounce)
    sar_arr[120:150, 300:360] = 245
    sar_arr[240:270, 300:360] = 250
    sar_arr[360:390, 300:360] = 255

    # Urban buildings (bright texture throughout, visible through cloud region)
    urban_sar = np.random.normal(180, 30, (360, 200)).clip(100, 240).astype(np.uint8)
    sar_arr[80:440, 80:280] = urban_sar

    sar_img = Image.fromarray(sar_arr, mode="L").convert("RGB")
    sar_path = SAMPLES_DIR / "sar_fusion.png"
    sar_img.save(sar_path)
    print(f"Generated: {sar_path.name}")

if __name__ == "__main__":
    print("Generating demo samples...")
    generate_demo1_optical_scene()
    generate_demo2_grounding_scene()
    generate_demo3_4_temporal_pair()
    generate_demo5_optical_sar_pair()
    print("All sample data generated successfully.")
