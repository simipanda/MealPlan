"""Add carbs to dinners that were meat-only; tidy a few ingredient lines."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "public" / "recipes.json"

ADDS: dict[str, tuple[dict, int]] = {
    "tuscan-chicken": (
        {"name": "Pasta or crusty bread to serve", "qty": 320, "unit": "g"},
        60,
    ),
    "chinese-lemon-chicken": (
        {"name": "Jasmine rice (dry)", "qty": 280, "unit": "g"},
        55,
    ),
    "south-indian-chicken-lentil-curry": (
        {"name": "Basmati rice (dry)", "qty": 280, "unit": "g"},
        55,
    ),
    "tom-yum": ({"name": "Jasmine rice (dry)", "qty": 280, "unit": "g"}, 55),
    "clear-mince-soup": ({"name": "Glass noodles", "qty": 200, "unit": "g"}, 45),
    "tom-jeid": ({"name": "Glass noodles", "qty": 200, "unit": "g"}, 45),
    "chicken-bites": (
        {"name": "Soft flour tortillas", "qty": 8, "unit": "each"},
        50,
    ),
    "chicken-passanda": (
        {"name": "Basmati rice (dry)", "qty": 140, "unit": "g"},
        55,
    ),
    "creamy-mushroom-chicken": (
        {"name": "Jasmine rice (dry)", "qty": 420, "unit": "g"},
        55,
    ),
    "one-pot-chicken-chasseur": (
        {"name": "Crusty bread", "qty": 1, "unit": "each"},
        45,
    ),
    "lighter-chicken-cacciatore": (
        {"name": "Pasta or new potatoes", "qty": 320, "unit": "g"},
        55,
    ),
    "herbed-honey-mustard-chicken": (
        {"name": "Baby potatoes", "qty": 800, "unit": "g"},
        35,
    ),
    "chimichurri-chicken-thighs": (
        {"name": "Jasmine rice (dry)", "qty": 420, "unit": "g"},
        55,
    ),
}

CARB_RE = re.compile(
    r"rice|pasta|noodle|penne|spaghetti|potato|tortilla|wrap|bread|"
    r"naan|couscous|quinoa|gnocchi|lasagne|orzo|tagliatelle|chapati|pitta|mash",
    re.I,
)
MEAT_RE = re.compile(
    r"chicken|beef|pork|lamb|turkey|prawn|shrimp|salmon|mince|sausage|"
    r"chorizo|guanciale|pancetta|steak|thigh|breast|fillet|shoulder",
    re.I,
)
STOCK_RE = re.compile(r"stock|broth|bouillon", re.I)


def has_carb(ings: list[dict]) -> bool:
    return any(CARB_RE.search(i["name"]) for i in ings)


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))

    for r in data:
        if r.get("catalog") == "sauce":
            continue
        rid = r["id"]

        if rid == "south-indian-chicken-lentil-curry":
            ings = r["ingredients"]
            if any(i["name"] == "Chicken thighs" for i in ings):
                r["ingredients"] = [i for i in ings if i["name"] != "Chicken"]
                for i in r["ingredients"]:
                    if i["name"] == "Chicken thighs" and (i.get("qty") or 0) < 500:
                        i["qty"] = 500
                        i["unit"] = "g"

        if rid in ("tom-jeid", "clear-mince-soup"):
            r["ingredients"] = [
                i
                for i in r["ingredients"]
                if not (
                    "glass noodles" in i["name"].lower()
                    and i.get("unit") == "toTaste"
                )
            ]

        if rid in ADDS and not has_carb(r["ingredients"]):
            carb, add_c = ADDS[rid]
            r["ingredients"].append(dict(carb))
            r["carbsPerPortionG"] = int((r.get("carbsPerPortionG") or 40) + add_c * 0.5)
            protein = r.get("proteinPerPortionG") or 35
            carbs = r["carbsPerPortionG"]
            fat = r.get("fatPerPortionG") or 15
            r["caloriesPerPortion"] = int(round(4 * protein + 4 * carbs + 9 * fat))
            kcal = r["caloriesPerPortion"]
            r["indulgence"] = (
                "light" if kcal <= 499 else "medium" if kcal <= 650 else "rich"
            )
            print("added carb", rid, "kcal", kcal, r["indulgence"])

    low, nocarb, nomeat, miss = [], [], [], []
    for r in data:
        if r.get("catalog") == "sauce":
            continue
        if (r.get("proteinPerPortionG") or 0) < 35:
            low.append(r["id"])
        if not has_carb(r["ingredients"]):
            nocarb.append(r["id"])
        if not any(
            MEAT_RE.search(i["name"]) and not STOCK_RE.search(i["name"])
            for i in r["ingredients"]
        ):
            nomeat.append(r["id"])
        if any(
            r.get(k) is None
            for k in (
                "caloriesPerPortion",
                "proteinPerPortionG",
                "carbsPerPortionG",
                "fatPerPortionG",
            )
        ):
            miss.append(r["id"])

    print("low", low)
    print("nocarb", nocarb)
    print("nomeat", nomeat)
    print("miss", miss)
    print("taco", next(r["title"] for r in data if r["id"] == "mexican-spice-sachet-tacos"))

    JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
