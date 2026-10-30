"""Copy generated midweek photos into public/images/recipes and wire recipes.json."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    r"C:\Users\Sim\.cursor\projects\c-Users-Sim-SANDBOX-MealPlan\assets"
)
DEST = ROOT / "public" / "images" / "recipes"
JSON_PATH = ROOT / "public" / "recipes.json"

IDS = [
    "mexican-spice-sachet-tacos",
    "holy-basil-mince-stir-fry",
    "gochujang-chicken",
    "bulgogi-beef",
    "dan-dan-pork-noodles",
    "lamb-kofta",
    "chilli-garlic-prawns",
    "miso-salmon",
    "keema",
    "harissa-chicken-traybake",
    "prawn-pil-pil",
    "kimchi-fried-rice",
    "salt-and-pepper-chicken",
    "chorizo-chickpea-stew",
    "tikka-jar-chicken",
    "korean-bbq-sachet-stir-fry",
]


def main() -> None:
    for rid in IDS:
        src = None
        for ext in (".jpg", ".jpeg", ".png", ".webp"):
            p = ASSETS / f"{rid}{ext}"
            if p.exists():
                src = p
                break
        if not src:
            print("MISSING ASSET", rid)
            continue
        dest = DEST / f"{rid}.jpg"
        if src.suffix.lower() in (".jpg", ".jpeg"):
            shutil.copy2(src, dest)
        else:
            from PIL import Image

            Image.open(src).convert("RGB").save(dest, "JPEG", quality=90)
        print(rid, dest.stat().st_size)

    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    for r in data:
        if r["id"] in IDS:
            r["image"] = f"images/recipes/{r['id']}.jpg"
    missing = [r["id"] for r in data if not r.get("image")]
    print("still missing image field", missing)
    JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
