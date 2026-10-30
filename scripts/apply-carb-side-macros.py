"""Attach per-portion macros to carbSideOptions; strip that from recipe base.

Recipe macros become meat/sauce only. UI adds the selected side.
Idempotent: skips strip when sides already carry caloriesPerPortion.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "public" / "recipes.json"

# Approx macros for **one person's** side (matches ~70g dry rice / typical sides).
SIDE_MACROS: dict[str, dict[str, int]] = {
    "rice": {"caloriesPerPortion": 250, "proteinPerPortionG": 5, "carbsPerPortionG": 55, "fatPerPortionG": 1},
    "couscous": {"caloriesPerPortion": 250, "proteinPerPortionG": 8, "carbsPerPortionG": 48, "fatPerPortionG": 1},
    "quinoa": {"caloriesPerPortion": 250, "proteinPerPortionG": 9, "carbsPerPortionG": 44, "fatPerPortionG": 4},
    "pasta": {"caloriesPerPortion": 280, "proteinPerPortionG": 10, "carbsPerPortionG": 55, "fatPerPortionG": 1},
    "potatoes": {"caloriesPerPortion": 110, "proteinPerPortionG": 3, "carbsPerPortionG": 25, "fatPerPortionG": 0},
    "mash": {"caloriesPerPortion": 160, "proteinPerPortionG": 4, "carbsPerPortionG": 35, "fatPerPortionG": 1},
    "crusty-bread": {"caloriesPerPortion": 200, "proteinPerPortionG": 7, "carbsPerPortionG": 38, "fatPerPortionG": 2},
    "garlic-bread": {"caloriesPerPortion": 280, "proteinPerPortionG": 7, "carbsPerPortionG": 35, "fatPerPortionG": 12},
    "naan": {"caloriesPerPortion": 300, "proteinPerPortionG": 9, "carbsPerPortionG": 50, "fatPerPortionG": 8},
    "chapati": {"caloriesPerPortion": 150, "proteinPerPortionG": 5, "carbsPerPortionG": 28, "fatPerPortionG": 3},
    "tortillas": {"caloriesPerPortion": 280, "proteinPerPortionG": 8, "carbsPerPortionG": 46, "fatPerPortionG": 7},
    "flatbreads": {"caloriesPerPortion": 220, "proteinPerPortionG": 7, "carbsPerPortionG": 40, "fatPerPortionG": 4},
    "glass-noodles": {"caloriesPerPortion": 180, "proteinPerPortionG": 0, "carbsPerPortionG": 44, "fatPerPortionG": 0},
    "egg-noodles": {"caloriesPerPortion": 280, "proteinPerPortionG": 10, "carbsPerPortionG": 52, "fatPerPortionG": 3},
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
