"""Parse recipes/*.md into public/recipes.json + copy images to public/images/recipes/."""
from __future__ import annotations

import json
import pathlib
import re
import shutil
from fractions import Fraction

ROOT = pathlib.Path(__file__).resolve().parents[1]
MD_DIR = ROOT / "recipes"
IMG_SRC = MD_DIR / "images"
IMG_DEST = ROOT / "public" / "images" / "recipes"
JSON_PATH = ROOT / "public" / "recipes.json"

CUP_ML = 240
OZ_G = 28.3495
LB_G = 453.592

UNICODE_FRAC = {
    "¼": "1/4",
    "½": "1/2",
    "¾": "3/4",
    "⅓": "1/3",
    "⅔": "2/3",
    "⅛": "1/8",
    "⅜": "3/8",
    "⅝": "5/8",
    "⅞": "7/8",
    "⅕": "1/5",
    "⅖": "2/5",
    "⅗": "3/5",
    "⅘": "4/5",
    "⅙": "1/6",
    "⅚": "5/6",
}

# Cups that are clearly liquids → ml; otherwise treat cup solids as ~g estimate
LIQUID_CUP_HINTS = (
    "stock",
    "broth",
    "water",
    "milk",
    "cream",
    "oil",
    "juice",
    "wine",
    "vinegar",
    "sauce",
    "soy",
    "mirin",
    "dashi",
    "purée",
    "puree",
    "tomato",
)


def normalize_text(s: str) -> str:
    s = s.replace("\u00a0", " ").replace("–", "-").replace("—", "-")
    for u, ascii_f in UNICODE_FRAC.items():
        s = s.replace(u, ascii_f + " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_number(s: str) -> float | None:
    s = normalize_text(s).lower()
    if not s:
        return None
    if re.match(r"^[\d./\s]+-\s*[\d./]+", s):
        parts = re.split(r"\s*-\s*", s, maxsplit=1)
        a, b = parse_number(parts[0]), parse_number(parts[1])
        if a is not None and b is not None:
            return round((a + b) / 2, 3)
    m = re.match(r"^(\d+)\s+(\d+)/(\d+)$", s)
    if m:
        return float(m.group(1)) + float(m.group(2)) / float(m.group(3))
    m = re.match(r"^(\d+)/(\d+)$", s)
    if m:
        return float(m.group(1)) / float(m.group(2))
    try:
        return float(Fraction(s))
    except Exception:
        try:
            return float(s)
        except Exception:
            return None


def clean_name(name: str) -> str:
    name = normalize_text(name)
    # Drop parenthetical prep notes for cleaner shop lines
    prev = None
    while prev != name:
        prev = name
        name = re.sub(r"\([^)]*\)", "", name)
        name = re.sub(r"\[[^\]]*\]", "", name)
    # Orphan brackets from nested note markup
    name = name.replace("(", " ").replace(")", " ")
    name = name.replace("[", " ").replace("]", " ")
    name = re.sub(r"^(to\s+\d+\s+)", "", name, flags=re.I)
    # Drop leading dual-unit leftovers and cut-instructions after comma
    name = re.sub(r"^/\s*\d+[^a-zA-Z]*", "", name)
    if "," in name:
        head, tail = name.split(",", 1)
        # keep short qualifier; drop long prep instructions
        if len(tail.strip()) > 24 or re.search(
            r"\b(cut|sliced|diced|chopped|minced|halved|peeled)\b", tail, re.I
        ):
            name = head
    name = re.sub(r",\s*$", "", name)
    name = re.sub(r"\s+", " ", name).strip(" ,.;:-/")
    if not name:
        return ""
    return name[0].upper() + name[1:]


def is_liquid_name(name: str) -> bool:
    n = name.lower()
    return any(h in n for h in LIQUID_CUP_HINTS)


def parse_ingredient(line: str) -> dict | None:
    raw = normalize_text(line.strip().lstrip("- ").strip())
    if not raw:
        return None
    if raw.upper().startswith("HOUSEHOLD:"):
        raw = raw[10:].strip()
    if "instead of apricots" in raw.lower():
        return None

    # 400g / 14 oz canned chickpeas
    m = re.match(
        r"^(?P<qty>\d+(?:\.\d+)?)\s*(?P<unit>g|kg|ml|oz)\s*/\s*\d+(?:\.\d+)?\s*(?:g|kg|ml|oz)\s+(?P<rest>.+)$",
        raw,
        re.I,
    )
    if m:
        return finalize_unit(float(m.group("qty")), m.group("unit"), m.group("rest"))

    # N x Ng item  OR N x item
    m = re.match(
        r"^(\d+)\s*[x×]\s*(?:(\d+(?:\.\d+)?)\s*(g|kg|oz|ml)\s*/?\s*(?:\d+\s*oz)?\s*)?(.+)$",
        raw,
        re.I,
    )
    if m and m.group(2):
        n = float(m.group(1))
        per = float(m.group(2))
        u = m.group(3).lower()
        name = clean_name(m.group(4))
        total = n * per
        if u == "kg":
            total *= 1000
        elif u == "oz":
            total *= OZ_G
        elif u == "ml":
            return {"name": name, "qty": round(n * per), "unit": "ml"}
        return {"name": name, "qty": round(total), "unit": "g"}
    if m and not m.group(2):
        return {"name": clean_name(m.group(4)), "qty": float(m.group(1)), "unit": "each"}

    # "2 to 3 tablespoons olive oil"
    m = re.match(
        r"^(?P<a>\d+(?:\.\d+)?)\s+to\s+(?P<b>\d+(?:\.\d+)?)\s+"
        r"(?P<unit>tablespoons?|tbsps?|tbsp|teaspoons?|tsps?|tsp|cups?|g|ml|oz)\b\.?\s*"
        r"(?P<rest>.+)$",
        raw,
        re.I,
    )
    if m:
        qty = (float(m.group("a")) + float(m.group("b"))) / 2
        return finalize_unit(qty, m.group("unit"), m.group("rest"))

    # qty + unit + name
    unit_pat = (
        r"^(?P<qty>\d+\s+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*"
        r"(?P<unit>"
        r"cups?|c|"
        r"tablespoons?|tbsps?|tbsp|tbs|"
        r"teaspoons?|tsps?|tsp|"
        r"grams?|g|"
        r"kilograms?|kg|"
        r"millilit(?:er|re)s?|mls?|ml|"
        r"ounces?|oz|"
        r"pounds?|lbs?|lb|"
        r"tins?|cans?|"
        r"cloves?|"
        r"pinches?|pinch|"
        r"lit(?:er|re)s?|l|"
        r"cm"
        r")\b\.?\s*(?P<rest>.+)$"
    )
    m = re.match(unit_pat, raw, re.I)
    if m:
        qty = parse_number(m.group("qty"))
        if qty is None:
            return {"name": clean_name(raw), "qty": None, "unit": "toTaste"}
        return finalize_unit(qty, m.group("unit"), m.group("rest"))

    # bare count, including ranges: 7-8 Baby Potatoes / 2-3 Cloves (spice)
    m = re.match(
        r"^(?P<qty>\d+\s+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s+(?P<rest>.+)$",
        raw,
    )
    if m:
        qty = parse_number(m.group("qty"))
        rest = m.group("rest").strip()
        rest_l = rest.lower()
        if rest_l.startswith("garlic clove") or (
            "garlic" in rest_l and "clove" in rest_l
        ):
            return {"name": "Garlic", "qty": qty, "unit": "clove"}
        # whole cloves spice (not garlic)
        if re.match(r"^cloves?\b", rest_l) and "garlic" not in rest_l:
            return {"name": "Cloves (spice)", "qty": qty, "unit": "each"}
        return {"name": clean_name(rest), "qty": qty, "unit": "each"}

    name = clean_name(raw)
    if not name:
        return None
    if re.search(r"\bto (taste|serve)\b", name, re.I) or re.search(
        r"\b(optional|garnish|as needed)\b", name, re.I
    ):
        name = re.sub(r",?\s*to (taste|serve).*$", "", name, flags=re.I).strip()
        name = clean_name(name) or clean_name(raw)
        return {"name": name, "qty": None, "unit": "toTaste"}
    return {"name": name, "qty": None, "unit": "toTaste"}


def finalize_unit(qty: float, unit_raw: str, rest: str) -> dict:
    unit_raw = unit_raw.lower().rstrip(".")
    name = clean_name(rest)

    if unit_raw in ("cup", "cups", "c"):
        if is_liquid_name(name):
            return {"name": name, "qty": round(qty * CUP_ML), "unit": "ml"}
        # solids by volume → rough grams (1 cup ≈ 150g average pantry)
        return {"name": name, "qty": round(qty * 150), "unit": "g"}
    if unit_raw in ("tablespoon", "tablespoons", "tbsp", "tbsps", "tbs"):
        return {"name": name, "qty": qty, "unit": "tbsp"}
    if unit_raw in ("teaspoon", "teaspoons", "tsp", "tsps"):
        return {"name": name, "qty": qty, "unit": "tsp"}
    if unit_raw in ("g", "gram", "grams"):
        return {"name": name, "qty": qty, "unit": "g"}
    if unit_raw in ("kg", "kilogram", "kilograms"):
        return {"name": name, "qty": round(qty * 1000), "unit": "g"}
    if unit_raw in (
        "ml",
        "mls",
        "milliliter",
        "milliliters",
        "millilitre",
        "millilitres",
    ):
        return {"name": name, "qty": qty, "unit": "ml"}
    if unit_raw in ("l", "liter", "liters", "litre", "litres"):
        return {"name": name, "qty": round(qty * 1000), "unit": "ml"}
    if unit_raw in ("oz", "ounce", "ounces"):
        return {"name": name, "qty": round(qty * OZ_G), "unit": "g"}
    if unit_raw in ("lb", "lbs", "pound", "pounds"):
        return {"name": name, "qty": round(qty * LB_G), "unit": "g"}
    if unit_raw in ("tin", "tins", "can", "cans"):
        return {"name": name, "qty": qty, "unit": "tin"}
    if unit_raw in ("clove", "cloves"):
        if "garlic" in name.lower() or not name:
            return {"name": "Garlic", "qty": qty, "unit": "clove"}
        # "6 cloves garlic peeled" already handled; spice cloves rare with unit word
        if name.lower().startswith("garlic"):
            return {"name": "Garlic", "qty": qty, "unit": "clove"}
        return {"name": name, "qty": qty, "unit": "clove"}
    if unit_raw in ("pinch", "pinches"):
        return {"name": name, "qty": None, "unit": "pinch"}
    if unit_raw == "cm":
        # e.g. 2.5 cm ginger → each piece
        return {"name": clean_name(f"{qty} cm {name}"), "qty": 1, "unit": "each"}
    return {"name": name, "qty": qty, "unit": "each"}


def parse_md(path: pathlib.Path) -> dict:
    text = path.read_text(encoding="utf-8")
    rid = path.stem

    portions = None
    m = re.search(r"\|\s*\*\*Portions\*\*\s*\|\s*([^|]+)\|", text)
    if m:
        pm = re.search(r"(\d+)", m.group(1))
        if pm:
            portions = int(pm.group(1))

    calories = None
    m = re.search(r"\|\s*\*\*Calories\*\*\s*\|\s*([^|]+)\|", text)
    if m:
        cm = re.search(r"(\d+)", m.group(1))
        if cm and "not" not in m.group(1).lower():
            calories = int(cm.group(1))

    household = None
    m = re.search(r"\*\*Household changes:\*\*\s*(.+)", text)
    if m:
        household = m.group(1).strip()

    ingredients = []
    m = re.search(r"## Ingredients\n+(.*?)(?:\n## |\n---|\Z)", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            line = line.strip()
            if not line.startswith("-"):
                continue
            parsed = parse_ingredient(line)
            if parsed and parsed["name"]:
                ingredients.append(parsed)

    method = []
    m = re.search(r"## Method\n+(.*?)(?:\n---|\Z)", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            line = line.strip()
            mm = re.match(r"^\d+\.\s+(.*)$", line)
            if mm:
                step = mm.group(1).strip()
                if step.upper().startswith("HOUSEHOLD:"):
                    step = step[10:].strip()
                method.append(step)

    image = None
    m = re.search(r"!\[[^\]]*\]\(images/([^)]+)\)", text)
    if m:
        image = m.group(1)
    else:
        for ext in (".jpg", ".png", ".webp", ".jpeg"):
            if (IMG_SRC / f"{rid}{ext}").exists():
                image = f"{rid}{ext}"
                break

    return {
        "id": rid,
        "portions": portions,
        "calories": calories,
        "household": household,
        "ingredients": ingredients,
        "method": method,
        "image": image,
    }


def apply_household_ingredient_fixes(rid: str, ingredients: list[dict]) -> list[dict]:
    if rid == "chicken-tagine":
        out = []
        seen_tomato = False
        for ing in ingredients:
            n = ing["name"].lower().strip()
            if "tomato" in n:
                if seen_tomato:
                    continue
                seen_tomato = True
                out.append({"name": "Crushed tomatoes", "qty": 2, "unit": "tin"})
                continue
            if n.startswith("couscous"):
                continue
            if n.startswith("/"):
                # salvage bad dual-unit parse leftovers
                n2 = clean_name(re.sub(r"^/\s*\d+\s*(g|oz|ml)\s*", "", n, flags=re.I))
                if n2:
                    out.append({**ing, "name": n2})
                continue
            out.append(ing)
        portions = 6
        out = [
            i
            for i in out
            if "couscous" not in i["name"].lower()
        ]
        out.append({"name": "Couscous", "qty": portions * 70, "unit": "g"})
        return out

    if rid == "tuscan-chicken":
        out = []
        for ing in ingredients:
            n = ing["name"].lower()
            if "double the italian" in n or n == "mushrooms":
                continue
            if "italian seasoning" in n and ing.get("qty"):
                out.append({**ing, "qty": (ing["qty"] or 0) * 2})
                continue
            out.append(ing)
        if not any("mushroom" in i["name"].lower() for i in out):
            out.append({"name": "Mushrooms", "qty": 250, "unit": "g"})
        return out

    if rid == "south-indian-chicken-lentil-curry":
        out = []
        for ing in ingredients:
            n = ing["name"].lower()
            if "monkfish" in n:
                continue
            out.append(ing)
        if not any("chicken" in i["name"].lower() for i in out):
            out.insert(0, {"name": "Chicken", "qty": 600, "unit": "g"})
        return out

    cleaned = []
    for ing in ingredients:
        name = ing["name"]
        if name.upper().startswith("HOUSEHOLD"):
            name = re.sub(r"^HOUSEHOLD[:\s]*", "", name, flags=re.I).strip()
            name = clean_name(name)
        if not name:
            continue
        cleaned.append({**ing, "name": name})
    return cleaned


def main():
    existing = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    by_id = {r["id"]: r for r in existing}
    IMG_DEST.mkdir(parents=True, exist_ok=True)

    md_files = [p for p in sorted(MD_DIR.glob("*.md")) if p.name.lower() != "readme.md"]
    updated = 0
    for md in md_files:
        parsed = parse_md(md)
        rid = parsed["id"]
        if rid not in by_id:
            print("WARN no recipes.json entry for", rid)
            continue
        recipe = by_id[rid]
        ingredients = apply_household_ingredient_fixes(rid, parsed["ingredients"])
        method = parsed["method"] or recipe.get("method") or []

        recipe["ingredients"] = ingredients
        recipe["method"] = method
        if parsed["calories"] is not None:
            recipe["caloriesPerPortion"] = parsed["calories"]
        if parsed["portions"] is not None:
            recipe["basePortions"] = parsed["portions"]
        # Household notes are not used — bake changes into ingredients/method instead.
        recipe.pop("householdNotes", None)

        if parsed["image"]:
            src = IMG_SRC / parsed["image"]
            if src.exists():
                dest_name = f"{rid}{src.suffix.lower()}"
                shutil.copy2(src, IMG_DEST / dest_name)
                recipe["image"] = f"images/recipes/{dest_name}"
            else:
                print("WARN missing image", src)

        by_id[rid] = recipe
        updated += 1
        print(
            f"OK {rid}: {len(ingredients)} ings, {len(method)} steps, "
            f"portions={recipe.get('basePortions')}, kcal={recipe.get('caloriesPerPortion')}"
        )

    out = [by_id[r["id"]] for r in existing]
    JSON_PATH.write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Wrote {JSON_PATH} ({updated} recipes)")


if __name__ == "__main__":
    main()
