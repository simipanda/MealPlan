"""Bump dinner meat to ~35g protein/portion and set approximate per-portion macros."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "public" / "recipes.json"

# Align ~125g chicken ≈ ~35g protein
DENSITY = {
    "chicken": 0.28,
    "turkey": 0.28,
    "beef": 0.26,
    "pork": 0.25,
    "lamb": 0.25,
    "prawn": 0.24,
    "salmon": 0.20,
    "chorizo": 0.24,
    "sausage": 0.15,
    "bacon": 0.13,
    "cheese": 0.25,
    "egg": 6.5,  # per egg
}

# Typical raw edible grams when ingredient is counted as "each"
EACH_G = {
    "chicken breast": 160,
    "chicken thigh": 120,
    "chicken leg": 140,
    "bone-in chicken thigh": 130,
    "sausage": 67,
    "salmon fillet": 150,
    "pork loin": 113,  # 1/4 lb
}

TARGET_P = 35.0


def is_sauce(r: dict) -> bool:
    return r.get("catalog") == "sauce"


def classify_meat_name(name: str) -> str | None:
    n = name.lower()
    if "stock" in n or "broth" in n or "bouillon" in n:
        return None
    if "bacon" in n or "guanciale" in n or "pancetta" in n:
        return "pork" if ("guanciale" in n or "pancetta" in n) else "bacon"
    if "chorizo" in n:
        return "chorizo"
    if "sausage" in n:
        return "sausage"
    if "prawn" in n or "shrimp" in n:
        return "prawn"
    if "salmon" in n:
        return "salmon"
    if "turkey" in n:
        return "turkey"
    if "chicken" in n:
        return "chicken"
    if "beef" in n or "steak" in n:
        return "beef"
    if "pork" in n and "pulled pork" not in n:
        return "pork"
    if "pulled pork" in n or "pork shoulder" in n:
        return "pork"
    if "lamb" in n:
        return "lamb"
    if re.search(r"\b(mince|ground)\b", n):
        return "beef"  # refined by recipe protein later
    return None


def refine_kind(kind: str, recipe_protein: str, name: str) -> str:
    n = name.lower()
    if kind == "beef" and re.search(r"\b(mince|ground)\b", n):
        return {
            "white": "turkey",
            "red": "beef",
            "pork": "pork",
            "lamb": "lamb",
        }.get(recipe_protein, "beef")
    if "pork" in n and "mince" in n:
        return "pork"
    return kind


def each_weight_g(name: str, kind: str) -> float:
    n = name.lower()
    if "salmon" in n:
        return EACH_G["salmon fillet"]
    if "sausage" in n:
        return EACH_G["sausage"]
    if "pork loin" in n or "1/4 pound" in n or "quarter pound" in n:
        return EACH_G["pork loin"]
    if "bone-in" in n and "thigh" in n:
        return EACH_G["bone-in chicken thigh"]
    if "leg" in n:
        return EACH_G["chicken leg"]
    if "thigh" in n:
        return EACH_G["chicken thigh"]
    if "breast" in n:
        return EACH_G["chicken breast"]
    if "pound" in n and "thigh" in n:
        # "2 pounds" stored as qty 2 each — treat as pounds → grams
        return 454
    if kind == "chicken":
        return EACH_G["chicken breast"]
    if kind == "sausage":
        return EACH_G["sausage"]
    if kind == "salmon":
        return EACH_G["salmon fillet"]
    return 125.0


def normalize_to_grams(recipe: dict) -> None:
    """Convert countable meat pieces to grams so shop + floor maths work."""
    protein_tag = recipe.get("protein", "white")
    for ing in recipe["ingredients"]:
        name = ing["name"]
        kind = classify_meat_name(name)
        if not kind or kind == "bacon":
            continue
        kind = refine_kind(kind, protein_tag, name)
        unit = ing.get("unit")
        qty = ing.get("qty")

        if unit == "g" and qty:
            continue

        if unit == "each" and qty:
            # Special: "Pounds boneless..." qty 2
            if "pound" in name.lower():
                ing["qty"] = int(round(float(qty) * 454))
                ing["unit"] = "g"
                # tidy name
                if "chicken" in name.lower():
                    ing["name"] = "Boneless skinless chicken thighs"
                continue
            grams = each_weight_g(name, kind) * float(qty)
            ing["qty"] = int(round(grams))
            ing["unit"] = "g"
            # clearer shop name
            if kind == "chicken":
                if "thigh" in name.lower():
                    ing["name"] = "Chicken thighs"
                elif "leg" in name.lower():
                    ing["name"] = "Chicken legs"
                else:
                    ing["name"] = "Chicken breast"
            elif kind == "sausage":
                ing["name"] = "Pork sausages"
            elif kind == "salmon":
                ing["name"] = "Salmon fillets"
            elif kind == "pork" and "loin" in name.lower():
                ing["name"] = "Pork loin"
            continue

        if unit == "toTaste" and kind == "pork" and "shoulder" in name.lower():
            # Pulled pork shoulder — set a house amount for 6 portions
            portions = max(1, recipe.get("basePortions") or 1)
            ing["name"] = "Pork shoulder"
            ing["qty"] = int(round(max(2000, 125 * portions / 0.25 * 0.25 * 4)))  # rough roast
            # Better: edible yield target 125g cooked ≈ 180g raw per portion for shoulder
            ing["qty"] = int(round(180 * portions))
            ing["unit"] = "g"


def meat_gram_lines(recipe: dict) -> list[tuple[dict, str, float]]:
    protein_tag = recipe.get("protein", "white")
    out = []
    for ing in recipe["ingredients"]:
        kind = classify_meat_name(ing["name"])
        if not kind or kind in ("bacon",):
            continue
        kind = refine_kind(kind, protein_tag, ing["name"])
        if ing.get("unit") != "g" or not ing.get("qty"):
            continue
        dens = DENSITY.get(kind, 0.25)
        out.append((ing, kind, dens))
    return out


def estimate_protein(recipe: dict) -> float:
    portions = max(1, recipe.get("basePortions") or 1)
    total = 0.0
    for ing, kind, dens in meat_gram_lines(recipe):
        total += float(ing["qty"]) * dens
    for ing in recipe["ingredients"]:
        n = ing["name"].lower()
        if re.search(r"\beggs?\b", n) and ing.get("unit") == "each" and ing.get("qty"):
            total += float(ing["qty"]) * DENSITY["egg"]
        if re.search(r"\b(parmesan|cheddar|mozzarella|cheese|neufchatel|cream cheese)\b", n):
            if ing.get("unit") == "g" and ing.get("qty"):
                total += float(ing["qty"]) * DENSITY["cheese"]
    return total / portions


def primary_meat(recipe: dict) -> tuple[dict, str, float] | None:
    lines = meat_gram_lines(recipe)
    if not lines:
        return None
    # Prefer non-chorizo primary when both exist
    non_chor = [t for t in lines if t[1] != "chorizo"]
    pool = non_chor or lines
    return max(pool, key=lambda t: float(t[0]["qty"]))


def min_grams_for(kind: str, portions: int) -> int:
    if kind in ("salmon",):
        per = max(175, TARGET_P / DENSITY["salmon"])
    elif kind == "prawn":
        per = max(150, TARGET_P / DENSITY["prawn"])
    elif kind == "sausage":
        per = TARGET_P / DENSITY["sausage"]
    elif kind == "chorizo":
        # keep chorizo sane; prefer other meat when possible
        per = min(TARGET_P / DENSITY["chorizo"], 80)
    else:
        per = max(125.0, TARGET_P / DENSITY.get(kind, 0.26))
    return int(round(per * portions))


def bump_meat(recipe: dict) -> None:
    portions = max(1, recipe.get("basePortions") or 1)
    # Cap absurd previous chorizo-only bumps: reset secondary cured meats to house amounts first
    for ing, kind, _ in meat_gram_lines(recipe):
        if kind == "chorizo" and float(ing["qty"]) > 300:
            ing["qty"] = 200 if portions <= 4 else 250

    primary = primary_meat(recipe)
    if primary is None:
        # invent a meat line from recipe protein tag
        tag = recipe.get("protein", "white")
        name = {
            "white": "Chicken breast",
            "red": "Beef mince",
            "pork": "Pork mince",
            "lamb": "Lamb mince",
            "fish": "Salmon fillets",
        }.get(tag, "Chicken breast")
        kind = {
            "white": "chicken",
            "red": "beef",
            "pork": "pork",
            "lamb": "lamb",
            "fish": "salmon",
        }.get(tag, "chicken")
        recipe["ingredients"].insert(
            0,
            {"name": name, "qty": min_grams_for(kind, portions), "unit": "g"},
        )
        return

    ing, kind, dens = primary
    need = min_grams_for(kind, portions)
    # If primary is chorizo and still under protein, add chicken instead of insane chorizo
    if kind == "chorizo" and estimate_protein(recipe) < TARGET_P - 0.5:
        chicken_g = min_grams_for("chicken", portions)
        # add or bump chicken
        chicken_line = next(
            (i for i, k, _ in meat_gram_lines(recipe) if k == "chicken"),
            None,
        )
        if chicken_line:
            chicken_line["qty"] = max(int(chicken_line["qty"]), chicken_g)
        else:
            recipe["ingredients"].insert(
                0,
                {"name": "Chicken breast", "qty": chicken_g, "unit": "g"},
            )
        if float(ing["qty"]) > 250:
            ing["qty"] = 200
        return

    if float(ing["qty"]) < need:
        ing["qty"] = need


def estimate_carbs(recipe: dict) -> float:
    portions = max(1, recipe.get("basePortions") or 1)
    total = 0.0
    for ing in recipe["ingredients"]:
        name = ing["name"].lower()
        qty = ing.get("qty")
        unit = ing.get("unit")
        if qty is None:
            continue
        if unit == "g":
            if "cooked rice" in name or "leftover" in name:
                total += float(qty) * 0.28
            elif any(k in name for k in ("rice", "basmati", "jasmine")):
                total += float(qty) * 0.78
            elif any(
                k in name
                for k in (
                    "pasta",
                    "noodle",
                    "spaghetti",
                    "tagliatelle",
                    "orzo",
                    "farfalle",
                )
            ):
                total += float(qty) * 0.75
            elif "couscous" in name:
                total += float(qty) * 0.77
            elif "potato" in name:
                total += float(qty) * 0.17
            elif "gnocchi" in name:
                total += float(qty) * 0.35
            elif "flour" in name and "tortilla" not in name:
                total += float(qty) * 0.76
            elif "lasagne" in name or "lasagna" in name:
                total += float(qty) * 0.72
            elif "sugar" in name or "honey" in name:
                total += float(qty) * 0.8
        elif unit == "each":
            if any(k in name for k in ("tortilla", "wrap")):
                total += float(qty) * 30
            elif any(k in name for k in ("naan", "flatbread", "pitta", "chapati", "pita")):
                total += float(qty) * 45
            elif "bread" in name:
                # one loaf for the table → ~35g carb/person
                total += 35 * portions
            elif "lasagne" in name:
                total += float(qty) * 20
        elif unit == "tin":
            if "chickpea" in name or "bean" in name:
                total += float(qty) * 40
            elif "tomato" in name:
                total += float(qty) * 15
    per = total / portions
    return max(per, 40.0)


def estimate_fat(recipe: dict, protein_g: float, carbs_g: float) -> float:
    portions = max(1, recipe.get("basePortions") or 1)
    fat = 0.0
    for ing in recipe["ingredients"]:
        name = ing["name"].lower()
        qty = ing.get("qty")
        unit = ing.get("unit")
        if qty is None:
            continue
        if unit == "g":
            if any(k in name for k in ("butter", "cheese", "parmesan", "cheddar", "mozzarella")):
                fat += float(qty) * 0.3
            if any(k in name for k in ("chorizo", "bacon", "sausage")):
                fat += float(qty) * 0.28
            if any(k in name for k in ("beef", "pork", "lamb", "mince", "steak")):
                fat += float(qty) * 0.12
            if "chicken" in name or "turkey" in name:
                fat += float(qty) * 0.08
            if "salmon" in name:
                fat += float(qty) * 0.13
            if "prawn" in name:
                fat += float(qty) * 0.02
        elif unit == "tbsp":
            if any(k in name for k in ("oil", "butter", "cream", "mayo", "peanut", "tahini")):
                fat += float(qty) * 12
        elif unit == "ml" and any(k in name for k in ("oil", "cream")):
            fat += float(qty) * 0.9
        elif unit == "tsp" and "oil" in name:
            fat += float(qty) * 4
    per = fat / portions
    return max(8.0, per)


def apply_macros(recipe: dict) -> None:
    protein = estimate_protein(recipe)
    carbs = estimate_carbs(recipe)
    fat = estimate_fat(recipe, protein, carbs)
    # nudge fat so kcal lands in a sane dinner band if extremely low/high
    kcal = 4 * protein + 4 * carbs + 9 * fat
    if kcal < 350:
        fat = (400 - 4 * protein - 4 * carbs) / 9
        kcal = 4 * protein + 4 * carbs + 9 * fat
    if kcal > 950:
        # trim fat estimate slightly for display sanity
        fat = min(fat, (900 - 4 * protein - 4 * carbs) / 9)
        fat = max(8.0, fat)
        kcal = 4 * protein + 4 * carbs + 9 * fat
    recipe["proteinPerPortionG"] = int(round(protein))
    recipe["carbsPerPortionG"] = int(round(carbs))
    recipe["fatPerPortionG"] = int(round(fat))
    recipe["caloriesPerPortion"] = int(round(kcal))


# Manual house fixes after auto pass (ids → meat grams overrides)
HAND = {
    "chicken-japchae": [("Chicken breast", 250)],  # 2 portions
    "quick-pork-ramen": [("Pork loin", 500)],
    "learn-to-make-spaghetti-carbonara": [("Guanciale or pancetta", 300)],
}


def apply_hand(recipe: dict) -> None:
    fixes = HAND.get(recipe["id"])
    if not fixes:
        return
    for name, grams in fixes:
        found = False
        for ing in recipe["ingredients"]:
            if classify_meat_name(ing["name"]) and ing.get("unit") == "g":
                # replace first meat-ish
                if not found and (
                    name.split()[0].lower() in ing["name"].lower()
                    or recipe["id"] in HAND
                ):
                    ing["name"] = name
                    ing["qty"] = grams
                    ing["unit"] = "g"
                    found = True
                    break
        if not found:
            recipe["ingredients"].insert(0, {"name": name, "qty": grams, "unit": "g"})


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    report = []
    for r in data:
        if is_sauce(r):
            continue
        before = estimate_protein(r)
        normalize_to_grams(r)
        apply_hand(r)
        bump_meat(r)
        # second bump after hand
        if estimate_protein(r) < TARGET_P - 0.5:
            bump_meat(r)
        apply_macros(r)
        # Final force: if still under, scale primary
        if estimate_protein(r) < TARGET_P - 0.5:
            prim = primary_meat(r)
            if prim:
                ing, kind, dens = prim
                ing["qty"] = int(round((TARGET_P * r["basePortions"]) / dens))
                apply_macros(r)
        report.append(
            (
                r["id"],
                round(before, 1),
                r["proteinPerPortionG"],
                r["caloriesPerPortion"],
                r["carbsPerPortionG"],
                r["fatPerPortionG"],
                [(i["name"], i["qty"]) for i, _, _ in meat_gram_lines(r)],
            )
        )

    JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    low = [row for row in report if row[2] < 35]
    print(f"meals={len(report)} under35={len(low)}")
    for row in low:
        print("LOW", row)
    print("--- sample ---")
    for row in report[:12]:
        print(row[0], f"P{row[1]}->{row[2]}", f"kcal{row[3]} C{row[4]} F{row[5]}", row[6])


if __name__ == "__main__":
    main()
