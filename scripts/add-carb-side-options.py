"""Attach carbSideOptions to meat-led dinners; remove vague baked-in carb lines."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "public" / "recipes.json"

# Ingredient names that were forced-in carbs or vague “to serve / or” sides.
VAGUE_CARB = re.compile(
    r"pasta or crusty|rice \(dry\) or|tortillas or rice|bread or mashed|"
    r"pasta or new potatoes|rice \(dry\) or potatoes|soft flour tortillas$"
    r"|crusty bread$|jasmine rice \(dry\)$|basmati rice \(dry\)$|glass noodles$"
    r"|baby potatoes$|pasta or crusty bread"
    r"|plain boiled long grain rice to serve"
    r"|rice mash or pasta"
    r"|rice naan and mango chutney"
    r"|flatbreads or pittas"
    r"|naan or chapati",
    re.I,
)


def rice(portions: int, kind: str = "Jasmine rice (dry)") -> dict:
    return {
        "id": "rice",
        "label": kind.replace(" (dry)", ""),
        "ingredients": [{"name": kind, "qty": 70 * portions, "unit": "g"}],
    }


def couscous(portions: int) -> dict:
    return {
        "id": "couscous",
        "label": "Couscous",
        "ingredients": [
            {"name": "Couscous (dry)", "qty": 70 * portions, "unit": "g"}
        ],
    }


def quinoa(portions: int) -> dict:
    return {
        "id": "quinoa",
        "label": "Quinoa",
        "ingredients": [
            {"name": "Quinoa (dry)", "qty": 70 * portions, "unit": "g"}
        ],
    }


def pasta(portions: int) -> dict:
    return {
        "id": "pasta",
        "label": "Pasta",
        "ingredients": [{"name": "Pasta", "qty": 80 * portions, "unit": "g"}],
    }


def potatoes(portions: int) -> dict:
    return {
        "id": "potatoes",
        "label": "Baby potatoes",
        "ingredients": [
            {"name": "Baby potatoes", "qty": 150 * portions, "unit": "g"}
        ],
    }


def crusty_bread(_portions: int) -> dict:
    return {
        "id": "crusty-bread",
        "label": "Crusty bread",
        "ingredients": [{"name": "Crusty bread", "qty": 1, "unit": "each"}],
    }


def garlic_bread(_portions: int) -> dict:
    return {
        "id": "garlic-bread",
        "label": "Garlic bread / focaccia",
        "ingredients": [
            {"name": "Garlic bread or focaccia", "qty": 1, "unit": "each"}
        ],
    }


def naan(portions: int) -> dict:
    return {
        "id": "naan",
        "label": "Naan",
        "ingredients": [{"name": "Naan", "qty": portions, "unit": "each"}],
    }


def chapati(portions: int) -> dict:
    return {
        "id": "chapati",
        "label": "Chapati",
        "ingredients": [{"name": "Chapati", "qty": portions, "unit": "each"}],
    }


def flatbreads(portions: int) -> dict:
    return {
        "id": "flatbreads",
        "label": "Flatbreads / pittas",
        "ingredients": [
            {"name": "Flatbreads or pittas", "qty": portions, "unit": "each"}
        ],
    }


def mash(portions: int) -> dict:
    return {
        "id": "mash",
        "label": "Mashed potato",
        "ingredients": [
            {"name": "Potatoes for mash", "qty": 200 * portions, "unit": "g"}
        ],
    }


def tortillas(portions: int) -> dict:
    return {
        "id": "tortillas",
        "label": "Soft flour tortillas",
        "ingredients": [
            {"name": "Soft flour tortillas", "qty": max(4, portions * 2), "unit": "each"}
        ],
    }


def glass_noodles(portions: int) -> dict:
    return {
        "id": "glass-noodles",
        "label": "Glass noodles",
        "ingredients": [
            {"name": "Glass noodles", "qty": 50 * portions, "unit": "g"}
        ],
    }


def egg_noodles(portions: int) -> dict:
    return {
        "id": "egg-noodles",
        "label": "Egg noodles",
        "ingredients": [
            {"name": "Egg noodles", "qty": 80 * portions, "unit": "g"}
        ],
    }


# recipe id → option builders (functions of portions)
SIDE_MAP: dict[str, list] = {
    "tuscan-chicken": [pasta, garlic_bread, crusty_bread, couscous, potatoes],
    "chinese-lemon-chicken": [rice, egg_noodles, quinoa],
    "south-indian-chicken-lentil-curry": [
        lambda p: rice(p, "Basmati rice (dry)"),
        naan,
        couscous,
    ],
    "tom-yum": [rice, glass_noodles],
    "clear-mince-soup": [glass_noodles, rice, quinoa],
    "tom-jeid": [glass_noodles, rice],
    "chicken-bites": [tortillas, rice, couscous],
    "chicken-passanda": [
        lambda p: rice(p, "Basmati rice (dry)"),
        naan,
        couscous,
    ],
    "creamy-mushroom-chicken": [rice, pasta, potatoes, crusty_bread],
    "one-pot-chicken-chasseur": [crusty_bread, potatoes, pasta, couscous],
    "lighter-chicken-cacciatore": [pasta, potatoes, garlic_bread, couscous],
    "herbed-honey-mustard-chicken": [potatoes, rice, couscous, crusty_bread],
    "chimichurri-chicken-thighs": [rice, potatoes, tortillas, quinoa, couscous],
    "chilli-con-carne-recipe": [
        lambda p: rice(p, "Long grain rice (dry)"),
        tortillas,
        crusty_bread,
        quinoa,
    ],
    "chicken-stroganoff": [rice, pasta, mash, potatoes],
    "chicken-madras": [
        lambda p: rice(p, "Basmati rice (dry)"),
        naan,
        chapati,
        couscous,
    ],
    "lamb-kofta": [flatbreads, couscous, rice, quinoa],
    "tikka-jar-chicken": [
        lambda p: rice(p, "Basmati rice (dry)"),
        naan,
        chapati,
        couscous,
    ],
}


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    for r in data:
        rid = r["id"]
        if rid not in SIDE_MAP:
            continue
        portions = int(r.get("basePortions") or 4)
        # strip vague / previously forced carb lines we added for the floor
        r["ingredients"] = [
            i
            for i in r["ingredients"]
            if not VAGUE_CARB.search(i["name"])
        ]
        # Madras line bundled chutney with rice/naan — keep chutney shoppable.
        if rid == "chicken-madras" and not any(
            "chutney" in i["name"].lower() for i in r["ingredients"]
        ):
            r["ingredients"].append(
                {"name": "Mango chutney", "qty": 1, "unit": "each"}
            )
        opts = []
        for builder in SIDE_MAP[rid]:
            opts.append(builder(portions))
        r["carbSideOptions"] = opts
        hint = "Serve with your chosen side carb from the plan picker."
        method = r.get("method") or []
        if hint not in method:
            method = [*method, hint]
            r["method"] = method
        print(rid, "options", [o["id"] for o in opts], "ings", len(r["ingredients"]))

    JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
