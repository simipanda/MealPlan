"""Add the four Adam recipes that blocked on first import; tidy long ids."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "public" / "recipes.json"
IMG_DIR = ROOT / "public" / "images" / "recipes"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def dl(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 2000:
        return True
    try:
        data = urlopen(Request(url, headers={"User-Agent": UA}), timeout=40).read()
        dest.write_bytes(data)
        print("img", dest.name, len(data))
        return True
    except Exception as e:
        print("img fail", dest.name, e)
        return False


MISSING = [
    {
        "id": "tuscan-chicken-pasta",
        "title": "Tuscan chicken pasta",
        "basePortions": 4,
        "caloriesPerPortion": 650,
        "totalMinutes": 45,
        "cookTag": "cook2",
        "protein": "white",
        "cuisine": "italian",
        "indulgence": "rich",
        "kidFriendly": False,
        "sourceUrl": "https://www.delish.com/cooking/recipe-ideas/a45774/chicken-bacon-and-spinach-spaghetti-recipe/",
        "image_url": "https://hips.hearstapps.com/hmg-prod/images/tuscan-chicken-pasta-index-6597300434bd4.jpg?crop=1.00xw:1.00xh;0,0&resize=1200:*",
        "ingredients": [
            {"name": "Spaghetti", "qty": 340, "unit": "g"},
            {"name": "Olive oil", "qty": 1, "unit": "tbsp"},
            {"name": "Chicken breasts", "qty": 565, "unit": "g"},
            {"name": "Salt", "qty": None, "unit": "toTaste"},
            {"name": "Black pepper", "qty": None, "unit": "toTaste"},
            {"name": "Bacon", "qty": 6, "unit": "each"},
            {"name": "Garlic", "qty": 2, "unit": "clove"},
            {"name": "Cherry tomatoes", "qty": 300, "unit": "g"},
            {"name": "Heavy cream", "qty": 120, "unit": "ml"},
            {"name": "Parmesan", "qty": 40, "unit": "g"},
            {"name": "Baby spinach", "qty": 90, "unit": "g"},
            {"name": "Fresh basil", "qty": None, "unit": "toTaste"},
        ],
        "method": [
            "Preheat oven to 350°F / 180°C, rack in the middle.",
            "Cook spaghetti in salted boiling water until al dente; drain, reserving 1 cup pasta water.",
            "Season chicken with salt and pepper. Sear in oil until golden, about 5 minutes per side. Finish in the oven 5–10 minutes; rest 10 minutes, then slice.",
            "In the same skillet, cook bacon until crisp; drain and chop.",
            "Cook garlic and halved cherry tomatoes 2 minutes. Add cream, Parmesan and ½ cup pasta water; simmer ~3 minutes. Wilt spinach.",
            "Toss in pasta, then chicken and bacon. Loosen with more pasta water if needed. Garnish with basil.",
        ],
    },
    {
        "id": "simple-lasagne-adam",
        "title": "Simple lasagne",
        "basePortions": 6,
        "caloriesPerPortion": 739,
        "totalMinutes": 100,
        "cookTag": "cook2",
        "protein": "red",
        "cuisine": "italian",
        "indulgence": "rich",
        "kidFriendly": True,
        "sourceUrl": "https://www.tesco.com/recipes/en-GB/recipe/simple-lasagne",
        "image_url": "https://digitalcontent.api.tesco.com/v2/media/realfood/488f0a94-ca2a-4923-9cdd-9b0c2e4803d6/768x432_LASAGNE+1.jpeg",
        "ingredients": [
            {"name": "Olive oil", "qty": 1, "unit": "tbsp"},
            {"name": "Onion", "qty": 1, "unit": "each"},
            {"name": "Carrot", "qty": 1, "unit": "each"},
            {"name": "Celery", "qty": 1, "unit": "each"},
            {"name": "Garlic", "qty": 2, "unit": "clove"},
            {"name": "Beef mince", "qty": 250, "unit": "g"},
            {"name": "Pork mince", "qty": 250, "unit": "g"},
            {"name": "Tomato puree", "qty": 1, "unit": "tbsp"},
            {"name": "Chopped tomatoes", "qty": 1, "unit": "tin"},
            {"name": "Beef stock", "qty": 200, "unit": "ml"},
            {"name": "Red wine", "qty": 200, "unit": "ml"},
            {"name": "Worcestershire sauce", "qty": 1, "unit": "tsp"},
            {"name": "Lasagne sheets", "qty": 12, "unit": "each"},
            {"name": "Parmesan", "qty": 50, "unit": "g"},
            {"name": "Mozzarella", "qty": 150, "unit": "g"},
            {"name": "Butter", "qty": 50, "unit": "g"},
            {"name": "Plain flour", "qty": 50, "unit": "g"},
            {"name": "Semi-skimmed milk", "qty": 550, "unit": "ml"},
        ],
        "method": [
            "Fry onion, carrot, celery and garlic in oil 5 minutes. Add beef and pork mince; brown. Pour in wine and reduce.",
            "Stir in tomato puree, chopped tomatoes, stock and Worcestershire; simmer ~15 minutes until reduced. Season.",
            "White sauce: melt butter, whisk in flour 1–2 minutes, then gradually whisk in milk until thick; season.",
            "Heat oven to 200°C/180°C fan/gas 6. Layer ragu, pasta and white sauce three times. Top with Parmesan and mozzarella.",
            "Bake 40–45 minutes until piping hot and bubbling.",
        ],
    },
    {
        "id": "beef-enchiladas",
        "title": "Beef enchiladas",
        "basePortions": 4,
        "caloriesPerPortion": 620,
        "totalMinutes": 75,
        "cookTag": "cook2",
        "protein": "red",
        "cuisine": "mexican",
        "indulgence": "rich",
        "kidFriendly": False,
        "sourceUrl": "https://www.bbc.co.uk/food/recipes/spicysteakandmontere_88037",
        "image_url": "https://ichef.bbci.co.uk/food/ic/food_16x9_1600/recipes/spicysteakandmontere_88037_16x9.jpg",
        "ingredients": [
            {"name": "Olive oil", "qty": 1, "unit": "tbsp"},
            {"name": "Beef mince", "qty": 500, "unit": "g"},
            {"name": "Red onion", "qty": 1, "unit": "each"},
            {"name": "Garlic", "qty": 3, "unit": "clove"},
            {"name": "Red chilli", "qty": 1, "unit": "each"},
            {"name": "Celery", "qty": 1, "unit": "each"},
            {"name": "Beef stock cube", "qty": 1, "unit": "each"},
            {"name": "Chipotle chilli paste", "qty": 3, "unit": "tbsp"},
            {"name": "Kidney beans in chilli sauce", "qty": 1, "unit": "tin"},
            {"name": "Chopped tomatoes", "qty": 1, "unit": "tin"},
            {"name": "Fresh coriander", "qty": 4, "unit": "tbsp"},
            {"name": "Soft corn tortillas", "qty": 8, "unit": "each"},
            {"name": "Sliced red jalapenos", "qty": 3, "unit": "tbsp"},
            {"name": "Cheddar", "qty": 200, "unit": "g"},
            {"name": "Salt", "qty": None, "unit": "toTaste"},
            {"name": "Black pepper", "qty": None, "unit": "toTaste"},
            {"name": "Soured cream", "qty": None, "unit": "toTaste"},
        ],
        "method": [
            "Brown the beef mince in oil over a high heat, breaking it up, 4–5 minutes.",
            "Add onion, garlic, chilli and celery; stir-fry 3–4 minutes.",
            "Add stock cube, chipotle paste, kidney beans and tomatoes. Simmer ~40 minutes until thick; stir in coriander and season.",
            "Heat oven to 220°C/200°C fan/Gas 7. Lightly oil a shallow dish (~20x30cm).",
            "Divide the beef down the centre of each tortilla, roll up and place seam-side down in the dish.",
            "Scatter jalapeños and cheese. Cover with foil 10 minutes, then uncover 10 minutes until golden. Serve with soured cream.",
        ],
    },
    {
        "id": "air-fryer-chimichangas",
        "title": "Air fryer chimichangas",
        "basePortions": 6,
        "caloriesPerPortion": 455,
        "totalMinutes": 30,
        "cookTag": "cook2",
        "protein": "white",
        "cuisine": "mexican",
        "indulgence": "rich",
        "kidFriendly": True,
        "sourceUrl": "https://www.allrecipes.com/recipe/278702/air-fryer-chimichangas/",
        "image_url": "https://www.allrecipes.com/thmb/oLkPesJQN949ZLQBTnJ5vlUHfIY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/278702air-fryer-chimichangasfabeveryday2x1-11347aa5d8f8474b98d992bf1e37e186.jpg",
        "ingredients": [
            {"name": "Vegetable oil", "qty": 1, "unit": "tbsp"},
            {"name": "Onion", "qty": 0.5, "unit": "each"},
            {"name": "Shredded cooked chicken", "qty": 300, "unit": "g"},
            {"name": "Neufchatel or cream cheese", "qty": 115, "unit": "g"},
            {"name": "Fire-roasted diced green chiles", "qty": 1, "unit": "tin"},
            {"name": "Chicken broth", "qty": 60, "unit": "ml"},
            {"name": "Chicken taco seasoning", "qty": 1.5, "unit": "tbsp"},
            {"name": "Salt", "qty": 0.5, "unit": "tsp"},
            {"name": "Black pepper", "qty": 0.25, "unit": "tsp"},
            {"name": "Flour tortillas (10 inch)", "qty": 6, "unit": "each"},
            {"name": "Mexican cheese blend", "qty": 100, "unit": "g"},
            {"name": "Cooking spray", "qty": None, "unit": "toTaste"},
        ],
        "method": [
            "Preheat air fryer to 200°C / 400°F.",
            "Soft fry onion in oil 4–6 minutes. Add chicken, cream cheese, green chiles, broth, taco seasoning, salt and pepper; cook until creamy.",
            "Warm tortillas until pliable. Fill each with ~⅓ cup chicken mix and cheese; roll burrito-style and mist with cooking spray.",
            "Air-fry 4–6 minutes, flip, spray again, and cook 2–4 minutes more until golden.",
        ],
    },
]


def main():
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    by_id = {r["id"]: r for r in data}

    # Rename long chimichurri id
    old = "juicy-skillet-chimichurri-chicken-thighs-recipe-one-pan-fabu"
    if old in by_id:
        r = by_id.pop(old)
        r["id"] = "chimichurri-chicken-thighs"
        r["title"] = "Chimichurri chicken thighs"
        by_id[r["id"]] = r
        print("renamed", old, "->", r["id"])

    # Fix a few protein tags on Adam recipes
    fixes = {
        "learn-to-make-spaghetti-carbonara": "pork",
        "speedy-sausage-stroganoff-tagliatelle": "pork",
        "chorizo-mozzarella-gnocchi-bake": "pork",
        "best-spaghetti-bolognese-recipe": "red",
        "meatballs-spaghetti": "red",
        "chilli-con-carne-recipe": "red",
        "chicken-chorizo-jambalaya": "white",
        "sticky-chilli-beef": "red",
    }
    for rid, protein in fixes.items():
        if rid in by_id:
            by_id[rid]["protein"] = protein

    for recipe in MISSING:
        rid = recipe["id"]
        if rid in by_id:
            print("skip existing", rid)
            continue
        img_url = recipe.pop("image_url", None)
        if img_url:
            dest = IMG_DIR / f"{rid}.jpg"
            if dl(img_url, dest):
                recipe["image"] = f"images/recipes/{rid}.jpg"
        by_id[rid] = recipe
        print("added", rid)

    # Preserve order: original list order then new
    # Rebuild: keep non-removed ids in previous order, append new
    old_order = [r["id"] for r in data if r["id"] != old]
    if old in [r["id"] for r in data]:
        # replace position of renamed
        old_order = [
            ("chimichurri-chicken-thighs" if i == old else i) for i in [r["id"] for r in data]
        ]
    seen = set()
    out = []
    for rid in old_order:
        if rid in by_id and rid not in seen:
            out.append(by_id[rid])
            seen.add(rid)
    for rid, r in by_id.items():
        if rid not in seen:
            out.append(r)
            seen.add(rid)

    JSON_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    sim = sum(1 for r in out if r.get("cookTag") == "cook1")
    adam = sum(1 for r in out if r.get("cookTag") == "cook2")
    sauce = sum(1 for r in out if r.get("catalog") == "sauce")
    print("totals cook1", sim, "cook2", adam, "sauce", sauce, "all", len(out))


if __name__ == "__main__":
    main()
