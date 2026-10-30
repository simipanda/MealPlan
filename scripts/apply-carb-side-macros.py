"""Attach per-portion macros to carbSideOptions; strip that from recipe base.

Recipe macros become meat/sauce only. UI adds the selected side.
Idempotent: skips strip when sides already carry caloriesPerPortion.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "public" / "recipes.json"

def _macros(p: int, c: int, f: int) -> dict[str, int]:
    """Per-portion side macros; kcal from 4P+4C+9F so swaps always move the total."""
    return {
        "proteinPerPortionG": p,
        "carbsPerPortionG": c,
        "fatPerPortionG": f,
        "caloriesPerPortion": 4 * p + 4 * c + 9 * f,
    }


# Approx macros for **one person's** side (~70g dry grain unless noted).
SIDE_MACROS: dict[str, dict[str, int]] = {
    # Dry white rice ~70g
    "rice": _macros(5, 56, 1),  # 253 kcal
    # Dry couscous ~70g — more protein, slightly fewer carbs than rice
    "couscous": _macros(9, 51, 1),  # 249 kcal — close to rice; carb/protein differ
    # Dry quinoa ~70g
    "quinoa": _macros(10, 46, 4),  # 260 kcal
    # Dry pasta ~80g
    "pasta": _macros(10, 58, 1),  # 281 kcal
    # Baby potatoes ~150g
    "potatoes": _macros(3, 26, 0),  # 116 kcal
    # Potatoes for mash ~200g plain
    "mash": _macros(4, 36, 1),  # 169 kcal
    # Shared loaf → ~1 large slice / person
    "crusty-bread": _macros(7, 40, 2),  # 206 kcal
    "garlic-bread": _macros(7, 36, 12),  # 280 kcal
    # 1 naan / person
    "naan": _macros(9, 52, 8),  # 316 kcal
    "chapati": _macros(5, 30, 3),  # 167 kcal
    # ~2 soft flour tortillas
    "tortillas": _macros(8, 48, 7),  # 295 kcal
    "flatbreads": _macros(7, 42, 4),  # 230 kcal
    # Glass noodles ~50g dry
    "glass-noodles": _macros(0, 45, 0),  # 180 kcal
    # Egg noodles ~80g
    "egg-noodles": _macros(10, 54, 3),  # 283 kcal
}


def indulgence(kcal: int) -> str:
    if kcal <= 499:
        return "light"
    if kcal <= 650:
        return "medium"
    return "rich"


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    for r in data:
        opts = r.get("carbSideOptions")
        if not opts:
            continue
        already = all(o.get("caloriesPerPortion") is not None for o in opts)
        for o in opts:
            m = SIDE_MACROS.get(o["id"])
            if not m:
                print("WARN missing macros for", r["id"], o["id"])
                continue
            o.update(m)

        first = opts[0]
        first_m = SIDE_MACROS.get(first["id"])
        if not first_m:
            continue

        if not already:
            # Previous totals included a default side — peel it off the base.
            for key, side_v in first_m.items():
                cur = r.get(key)
                if cur is None:
                    continue
                r[key] = max(0, int(cur) - int(side_v))
            # Keep kcal roughly consistent with P/C/F after strip
            p = r.get("proteinPerPortionG") or 0
            c = r.get("carbsPerPortionG") or 0
            f = r.get("fatPerPortionG") or 0
            r["caloriesPerPortion"] = int(round(4 * p + 4 * c + 9 * f))

        plate_kcal = (r.get("caloriesPerPortion") or 0) + first_m["caloriesPerPortion"]
        r["indulgence"] = indulgence(plate_kcal)
        print(
            r["id"],
            "base",
            r.get("caloriesPerPortion"),
            "default plate",
            plate_kcal,
            r["indulgence"],
        )

    JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
