"""Import Adam's recipe list into public/recipes.json as cookTag cook2."""
from __future__ import annotations

import html as html_lib
import json
import re
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "public" / "recipes.json"
IMG_DIR = ROOT / "public" / "images" / "recipes"
HTML_PATH = ROOT / "adams_Recipes.html"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Known Google share → real recipe URL (resolved / guessed from title)
SHARE_MAP = {
    "https://share.google/KtoormjdsjORKSL8i": "https://www.recipetineats.com/chicken-fajitas/",
    "https://share.google/C6idZSDknOj4RY08o": "https://www.delish.com/cooking/recipe-ideas/a19636189/tuscan-chicken-pasta-recipe/",
    "https://share.google/ssZpgYhCEqZ5UDyIv": "https://realfood.tesco.com/recipes/easy-lasagne.html",
    "https://share.google/NqYB3cxEDIpp7hNmW": "https://www.bbcgoodfood.com/recipes/prawn-harissa-spaghetti",
    "https://share.google/6sPjKgDJcuvYYWjlU": "https://www.bbcgoodfood.com/recipes/one-pot-chicken-chasseur",
    "https://share.google/oUnwcE4F44HVbG5zF": "https://www.marksandspencer.com/recipes/sticky-chilli-beef",
}

MANUAL = {
    # sticky chilli beef — M&S page often blocks; household sketch from typical sticky chilli beef
    "sticky-chilli-beef": {
        "title": "Sticky chilli beef",
        "sourceUrl": "https://www.marksandspencer.com/recipes/sticky-chilli-beef",
        "basePortions": 4,
        "totalMinutes": 35,
        "protein": "red",
        "cuisine": "chinese",
        "indulgence": "rich",
        "kidFriendly": False,
        "caloriesPerPortion": 520,
        "ingredients": [
            {"name": "Beef steak strips", "qty": 400, "unit": "g"},
            {"name": "Cornflour", "qty": 2, "unit": "tbsp"},
            {"name": "Vegetable oil", "qty": 2, "unit": "tbsp"},
            {"name": "Garlic", "qty": 3, "unit": "clove"},
            {"name": "Fresh ginger", "qty": 20, "unit": "g"},
            {"name": "Red chilli", "qty": 1, "unit": "each"},
            {"name": "Soy sauce", "qty": 3, "unit": "tbsp"},
            {"name": "Honey", "qty": 2, "unit": "tbsp"},
            {"name": "Rice vinegar or lime juice", "qty": 1, "unit": "tbsp"},
            {"name": "Spring onions", "qty": 3, "unit": "each"},
            {"name": "Sesame seeds", "qty": None, "unit": "toTaste"},
            {"name": "Cooked rice", "qty": None, "unit": "toTaste"},
        ],
        "method": [
            "Toss beef strips in cornflour and season.",
            "Stir-fry in hot oil in batches until browned; set aside.",
            "Fry garlic, ginger and chilli briefly until fragrant.",
            "Add soy, honey and vinegar; bubble to a sticky glaze.",
            "Return beef and toss to coat. Finish with spring onions and sesame seeds; serve with rice.",
        ],
    },
}


def fetch(url: str, timeout: int = 35) -> bytes | None:
    try:
        req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/json"})
        with urlopen(req, timeout=timeout) as res:
            # follow redirects; capture final
            return res.read()
    except Exception as e:
        print("FETCH FAIL", url, e)
        return None


def resolve_url(url: str) -> str:
    url = html_lib.unescape(url).strip()
    if url in SHARE_MAP:
        return SHARE_MAP[url]
    if "share.google" in url:
        # try follow redirect
        try:
            req = Request(url, headers={"User-Agent": UA})
            with urlopen(req, timeout=20) as res:
                final = res.geturl()
                print("resolved share", url, "->", final)
                return final
        except Exception as e:
            print("share resolve fail", url, e)
    # clean amp bbc food
    if "bbc.co.uk/food/recipes" in url or "spicysteakandmontere" in url:
        m = re.search(r"(https://www\.bbc\.co\.uk/food/recipes/[a-z0-9_]+)", unquote(url))
        if m:
            return m.group(1)
        if "spicysteakandmontere" in url:
            return "https://www.bbc.co.uk/food/recipes/spicysteakandmontere_88037"
    return url.split("#")[0]


def slug_from_url(url: str, title: str | None = None) -> str:
    path = urlparse(url).path.rstrip("/")
    base = path.split("/")[-1] or "recipe"
    base = re.sub(r"\.html?$", "", base, flags=re.I)
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    if not base or base in ("recipes", "recipe", "amp"):
        base = re.sub(r"[^a-z0-9]+", "-", (title or "adam-recipe").lower()).strip("-")
    return base[:60]


def extract_jsonld(text: str) -> list:
    blocks = []
    for m in re.finditer(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        text,
        re.I | re.S,
    ):
        raw = m.group(1).strip()
        try:
            blocks.append(json.loads(raw))
        except Exception:
            try:
                cleaned = re.sub(r",\s*}", "}", re.sub(r",\s*]", "]", raw))
                blocks.append(json.loads(cleaned))
            except Exception:
                pass
    return blocks


def find_recipes(obj, found=None):
    if found is None:
        found = []
    if isinstance(obj, dict):
        t = obj.get("@type")
        types = t if isinstance(t, list) else [t]
        if any(x and "Recipe" in str(x) for x in types):
            found.append(obj)
        for v in obj.values():
            find_recipes(v, found)
    elif isinstance(obj, list):
        for i in obj:
            find_recipes(i, found)
    return found


def walk_instructions(ins, steps):
    if isinstance(ins, str):
        steps.append(html_lib.unescape(re.sub(r"<[^>]+>", "", ins)).strip())
    elif isinstance(ins, dict):
        if ins.get("text"):
            steps.append(html_lib.unescape(re.sub(r"<[^>]+>", "", ins["text"])).strip())
        elif ins.get("itemListElement"):
            walk_instructions(ins["itemListElement"], steps)
    elif isinstance(ins, list):
        for x in ins:
            walk_instructions(x, steps)


def parse_iso_minutes(iso) -> int | None:
    if not iso:
        return None
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?", str(iso))
    if not m:
        return None
    h = int(m.group(1) or 0)
    mi = int(m.group(2) or 0)
    return h * 60 + mi


def parse_number(s: str) -> float | None:
    s = s.strip().lower().replace("–", "-").replace("—", "-")
    if re.match(r"^[\d./\s]+-\s*[\d./]+", s):
        parts = re.split(r"\s*-\s*", s, maxsplit=1)
        a, b = parse_number(parts[0]), parse_number(parts[1])
        if a is not None and b is not None:
            return (a + b) / 2
    m = re.match(r"^(\d+)\s+(\d+)/(\d+)$", s)
    if m:
        return float(m.group(1)) + float(m.group(2)) / float(m.group(3))
    m = re.match(r"^(\d+)/(\d+)$", s)
    if m:
        return float(m.group(1)) / float(m.group(2))
    try:
        return float(s)
    except Exception:
        return None


def clean_name(name: str) -> str:
    name = html_lib.unescape(name)
    name = re.sub(r"\([^)]*\)", "", name)
    name = re.sub(r"\s+", " ", name).strip(" ,.;:-")
    if not name:
        return ""
    return name[0].upper() + name[1:]


def parse_ingredient(line: str) -> dict | None:
    raw = html_lib.unescape(line.strip())
    if not raw:
        return None
    # 750g / 2 tbsp / 1 onion
    unit_pat = (
        r"^(?P<qty>\d+\s+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*"
        r"(?P<unit>kg|g|ml|l|litre|litres|tsp|tbsp|tablespoons?|teaspoons?|cups?|"
        r"tins?|cans?|cloves?|pinch|pack|packs?|bunch|bunches?)\b\.?\s*(?P<rest>.+)$"
    )
    m = re.match(unit_pat, raw, re.I)
    if m:
        qty = parse_number(m.group("qty"))
        unit = m.group("unit").lower()
        name = clean_name(m.group("rest"))
        if qty is None:
            return {"name": clean_name(raw), "qty": None, "unit": "toTaste"}
        if unit in ("kg",):
            return {"name": name, "qty": round(qty * 1000), "unit": "g"}
        if unit in ("g",):
            return {"name": name, "qty": qty, "unit": "g"}
        if unit in ("l", "litre", "litres"):
            return {"name": name, "qty": round(qty * 1000), "unit": "ml"}
        if unit in ("ml",):
            return {"name": name, "qty": qty, "unit": "ml"}
        if unit in ("tsp", "teaspoon", "teaspoons"):
            return {"name": name, "qty": qty, "unit": "tsp"}
        if unit in ("tbsp", "tablespoon", "tablespoons"):
            return {"name": name, "qty": qty, "unit": "tbsp"}
        if unit in ("cup", "cups"):
            # liquid-ish default to ml
            return {"name": name, "qty": round(qty * 240), "unit": "ml"}
        if unit in ("tin", "tins", "can", "cans"):
            return {"name": name, "qty": qty, "unit": "tin"}
        if unit in ("clove", "cloves"):
            return {"name": name if name else "Garlic", "qty": qty, "unit": "clove"}
        if unit in ("pinch",):
            return {"name": name, "qty": None, "unit": "pinch"}
        if unit in ("pack", "packs", "bunch", "bunches"):
            return {"name": name, "qty": qty, "unit": "each"}
    m = re.match(r"^(?P<qty>\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s+(?P<rest>.+)$", raw)
    if m:
        return {
            "name": clean_name(m.group("rest")),
            "qty": parse_number(m.group("qty")),
            "unit": "each",
        }
    name = clean_name(raw)
    if not name:
        return None
    return {"name": name, "qty": None, "unit": "toTaste"}


def guess_protein(title: str, ings: list[dict]) -> str:
    blob = (title + " " + " ".join(i["name"] for i in ings)).lower()
    if any(w in blob for w in ("prawn", "shrimp", "fish", "salmon", "cod")):
        return "fish"
    if any(w in blob for w in ("pork", "sausage", "chorizo", "bacon", "prosciutto", "pepperoni")):
        # chorizo chicken dishes still often poultry-primary
        if "chicken" in blob and "chorizo" in blob:
            return "white"
        return "pork"
    if any(w in blob for w in ("beef", "steak", "mince", "bolognese", "chilli con", "meatball")):
        if "chicken" in blob and "beef" not in blob and "steak" not in blob:
            pass
        else:
            return "red"
    if "lamb" in blob:
        return "lamb"
    if any(w in blob for w in ("chicken", "turkey", "fajita")):
        return "white"
    if any(w in blob for w in ("veg", "vegetarian", "pasta carbonara")):
        # carbonara is pork (pancetta) usually
        if "carbonara" in blob:
            return "pork"
    if "carbonara" in blob:
        return "pork"
    return "white"


def guess_cuisine(title: str, url: str) -> str:
    blob = (title + " " + url).lower()
    if any(w in blob for w in ("fajita", "chimichanga", "cajun", "jambalaya", "jerk")):
        if "jerk" in blob:
            return "caribbean"
        if "cajun" in blob or "jambalaya" in blob:
            return "american"
        return "mexican"
    if any(w in blob for w in ("chilli con", "chimichurri")):
        return "mexican" if "chilli" in blob else "misc"
    if "madras" in blob:
        return "indian"
    if any(w in blob for w in ("stroganoff",)):
        return "misc"
    if any(w in blob for w in ("lasagne", "lasagna", "bolognese", "carbonara", "gnocchi", "spaghetti", "tagliatelle", "cacciatore", "chasseur", "tuscan")):
        return "italian" if "chasseur" not in blob else "misc"
    if "chasseur" in blob:
        return "misc"
    if any(w in blob for w in ("sticky chilli", "chilli beef")):
        return "chinese"
    if "harissa" in blob:
        return "misc"
    return "misc"


def download_image(url: str, dest: Path) -> bool:
    if not url:
        return False
    if dest.exists() and dest.stat().st_size > 1000:
        return True
    data = fetch(url)
    if not data:
        return False
    dest.write_bytes(data)
    return True


def recipe_from_page(url: str) -> dict | None:
    raw = fetch(url)
    if not raw:
        return None
    text = raw.decode("utf-8", errors="ignore")
    recipes = find_recipes(extract_jsonld(text))
    if not recipes:
        print("NO JSON-LD Recipe", url)
        return None
    r = recipes[0]
    name = html_lib.unescape(r.get("name") or "Recipe")
    y = r.get("recipeYield")
    if isinstance(y, list):
        y = y[0]
    portions = 4
    if y:
        m = re.search(r"(\d+)", str(y))
        if m:
            portions = int(m.group(1))
    prep = parse_iso_minutes(r.get("prepTime")) or 0
    cook = parse_iso_minutes(r.get("cookTime")) or 0
    total = parse_iso_minutes(r.get("totalTime")) or (prep + cook) or 45
    nut = r.get("nutrition") or {}
    cal = None
    if isinstance(nut, dict):
        cm = re.search(r"(\d+)", str(nut.get("calories") or ""))
        if cm:
            cal = int(cm.group(1))
    ings = []
    for line in r.get("recipeIngredient") or []:
        parsed = parse_ingredient(str(line))
        if parsed and parsed["name"]:
            ings.append(parsed)
    steps: list[str] = []
    walk_instructions(r.get("recipeInstructions") or [], steps)
    steps = [s for s in steps if s]
    img = r.get("image")
    if isinstance(img, list) and img:
        img = img[0]
    if isinstance(img, dict):
        img = img.get("url")
    if not img:
        m = re.search(
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            text,
            re.I,
        )
        if m:
            img = m.group(1)
    rid = slug_from_url(url, name)
    protein = guess_protein(name, ings)
    cuisine = guess_cuisine(name, url)
    indulgence = "rich" if any(
        w in name.lower() for w in ("cheesy", "carbonara", "lasagne", "stroganoff", "bake", "sticky")
    ) else "light"
    out = {
        "id": rid,
        "title": name,
        "basePortions": portions,
        "totalMinutes": total,
        "cookTag": "cook2",
        "protein": protein,
        "cuisine": cuisine,
        "indulgence": indulgence,
        "kidFriendly": False,
        "sourceUrl": url,
        "ingredients": ings,
        "method": steps
        or ["Follow the original recipe for the method and amounts."],
    }
    if cal:
        out["caloriesPerPortion"] = cal
    else:
        out["caloriesPerPortion"] = 620 if indulgence == "rich" else 450
    # image
    if img:
        ext = ".png" if ".png" in img.lower() else ".jpg"
        dest = IMG_DIR / f"{rid}{ext}"
        if download_image(img, dest):
            out["image"] = f"images/recipes/{rid}{ext}"
    return out


def parse_adam_list() -> list[str]:
    text = HTML_PATH.read_text(encoding="utf-8", errors="ignore")
    text = html_lib.unescape(text)
    urls = []
    # bare urls in lines
    for m in re.finditer(r"https?://[^\s<>\"]+", text):
        u = m.group(0).rstrip(").,;")
        urls.append(u)
    # dedupe preserve order
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    # Existing book = Sim
    for r in data:
        if r.get("catalog") == "sauce":
            continue
        r["cookTag"] = "cook1"

    existing_ids = {r["id"] for r in data}
    existing_urls = {r.get("sourceUrl", "").split("#")[0] for r in data}

    urls = parse_adam_list()
    print("Adam URL count", len(urls))
    added = []
    failed = []

    for raw_url in urls:
        url = resolve_url(raw_url)
        print("\n==", url)
        if "marksandspencer.com/recipes/sticky-chilli-beef" in url:
            man = MANUAL["sticky-chilli-beef"]
            rid = "sticky-chilli-beef"
            if rid in existing_ids:
                print("skip existing id", rid)
                continue
            recipe = {
                "id": rid,
                "cookTag": "cook2",
                "kidFriendly": man["kidFriendly"],
                **{k: v for k, v in man.items()},
            }
            data.append(recipe)
            existing_ids.add(rid)
            added.append(rid)
            continue

        if url.split("#")[0] in existing_urls:
            # still add Adam copy? prefer unique id with -adam if same source
            print("source already in book; importing as Adam-owned with unique id if needed")

        recipe = recipe_from_page(url)
        time.sleep(0.4)
        if not recipe:
            failed.append(url)
            continue
        rid = recipe["id"]
        if rid in existing_ids:
            rid = rid + "-adam"
            recipe["id"] = rid
        data.append(recipe)
        existing_ids.add(recipe["id"])
        existing_urls.add(url.split("#")[0])
        added.append(recipe["id"])
        print(
            "OK",
            recipe["id"],
            recipe["title"],
            "ings",
            len(recipe["ingredients"]),
            "kcal",
            recipe.get("caloriesPerPortion"),
        )

    JSON_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("\nDONE added", len(added), added)
    print("FAILED", failed)
    sim = sum(1 for r in data if r.get("cookTag") == "cook1")
    adam = sum(1 for r in data if r.get("cookTag") == "cook2")
    sauce = sum(1 for r in data if r.get("catalog") == "sauce")
    print("totals cook1", sim, "cook2", adam, "sauce", sauce, "all", len(data))


if __name__ == "__main__":
    main()
