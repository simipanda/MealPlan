# Filling out recipes

How to add or edit a dish in MealPlan so shop, cook mode, calories, and protein swaps work.

Published data lives in `public/recipes.json`. Photos go under `public/images/recipes/`. Optional study markdown under `recipes/` is for critique only — the app reads JSON.

## Steps

1. **Add or edit the object** in `public/recipes.json` (keep `id` stable — it is the key in plans and localStorage overlays).
2. **Fill required fields** (see Reference below).
3. **Write ingredients** with real amounts in app units so shop can scale.
4. **Write method** as short cook/prep steps the cook can follow in the app.
5. **Hit the protein floor** for dinners — about **35g protein per portion** (benchmark ~**125g raw chicken breast** or equivalent meat per person). Raise the meat grams in ingredients if short.
6. **Set per-portion macros** — `caloriesPerPortion`, `proteinPerPortionG`, `carbsPerPortionG`, `fatPerPortionG` (one plate only, never the whole batch). Kcal should roughly match `4×P + 4×C + 9×F`.
7. **Set `proteinOptions` only when a meat swap is normal** for this house (same grams, different animal).
8. **Copy a photo** to `public/images/recipes/{id}.jpg` (or `.png`) and set `image` to `images/recipes/{id}.jpg`.
9. **Check in the app** — recipe detail shows amounts, method, macros; shop scales when the dish is on the plan; meat chips appear if swaps exist.

**Done when:** the recipe has ingredients with quantities, a usable method, meat + carb for dinners, ~35g protein/portion, full macros, the right default protein, swaps only if intentional, and a working image path.

## Reference

### Required fields

| Field | Meaning |
|---|---|
| `id` | Stable slug (`chicken-tagine`) |
| `title` | Display name |
| `basePortions` | How many people the listed amounts feed |
| `totalMinutes` | Prep + cook |
| `cookTag` | `cook1` \| `cook2` \| `either` |
| `protein` | Default: `white` \| `red` \| `pork` \| `lamb` \| `fish` \| `veg` |
| `cuisine` | One cuisine key from the app list |
| `indulgence` | `light` \| `medium` \| `rich` (from kcal/portion: ≤499 / 500–650 / ≥651) |
| `kidFriendly` | boolean |
| `ingredients` | Array of `{ name, qty, unit }` |
| `method` | Array of step strings |
| `caloriesPerPortion` | Approx kcal for **one portion** (meals) |
| `proteinPerPortionG` | Approx protein grams for **one portion** (meals; ≥ ~35) |
| `carbsPerPortionG` | Approx carb grams for **one portion** (meals) |
| `fatPerPortionG` | Approx fat grams for **one portion** (meals) |

### Optional fields

| Field | Meaning |
|---|---|
| `sourceUrl` | Original page (opens as “Original recipe”) |
| `image` | Path under `public/`, e.g. `images/recipes/foo.jpg` |
| `proteinOptions` | Extra proteins allowed as swaps, e.g. `["pork","white"]` |
| `proteinOptionLabels` | Chip labels, e.g. `{ "white": "Turkey mince" }` |
| `carbSideOptions` | Side-carb choices when the original dish has no baked-in carb: `[{ id, label, ingredients }]` |
| `catalog` | `meal` (default) or `sauce` for dressings/sauces |

Macros are required for **meals**. For sauces they are optional (one sauce serving, not a dinner).

Do **not** use `householdNotes`. Real changes belong in `ingredients` / `method`.

### Meals vs dressings & sauces

- **`catalog: "meal"`** — dinners; randomise and week plan use these only.
- **`catalog: "sauce"`** — dressings, sauces, condiments. Shown under **Dressings & sauces** in the book. Never planned as a meal. Cooks can **add their ingredients to this week’s shop** ad hoc (Shop tab or recipe detail).

### Ingredient units

Only these units scale in shop/cook:

`g` · `ml` · `tsp` · `tbsp` · `each` · `tin` · `clove` · `pinch` · `toTaste`

Rules:

- Prefer **metric weights/volumes** (`g`, `ml`) for shoppable items.
- `qty` may be `null` only with `toTaste` or `pinch`.
- **Carbs / sides that are part of the meal** (couscous, rice) get a normal human dry weight: about **70 g dry couscous or rice per person** × `basePortions`.
- If this house always uses two tins of tomatoes, write `2` + `tin` — do not leave a note about it.
- Protein swaps keep the **same grams**; only the meat name / protein category changes at cook time.

### Method

- Short numbered actions: brown, simmer, serve.
- Write the dish **as this house cooks it** (chicken not monkfish, two tins already in the sauce, couscous in the ingredients).
- Do not leave “follow the original” as the only step once amounts exist.

### Calories and macros

All of `caloriesPerPortion`, `proteinPerPortionG`, `carbsPerPortionG`, and `fatPerPortionG` are **per portion**, so you can do the maths in your head:

`people eating × value ≈ meal total`

Never store the whole-pot total. If a source lists nutrition for the whole recipe, **divide by `basePortions`** before saving.

- Prefer the source’s **per-serving** numbers when trustworthy.
- Otherwise approximate one plated share (meat + sauce + carb).
- Keep kcal roughly consistent with `4×protein + 4×carbs + 9×fat`.
- Dressings: one serving of dressing, not a dinner; 35g protein floor does **not** apply.
- App: detail shows the macros panel; lists may show `~N kcal/portion`.

### Protein floor (dinners)

Each dinner portion should deliver **~35g protein minimum**.

- Benchmark: about **125g raw chicken breast per person** (or equivalent other meat by protein density).
- Scale the meat ingredient: e.g. `basePortions` 4 → about **500g** chicken/mince minimum before sauce losses.
- Protein swaps keep the **same grams**; bump the shared meat line so every swap still clears the floor.
- Do not ship “token” meat amounts that leave a hungry plate.

### Household cooking rules

- **Every dinner meal must have real meat** (chicken, turkey, beef, pork, lamb, or fish/prawns). No vegetarian mains.
- **Every dinner meal must include a proper carb** so the plate fills you up: rice, pasta, noodles, potatoes, bread, wraps/tortillas, couscous, quinoa, or similar. Meat + veg alone is not a complete meal.
  - If the **source recipe already includes** the carb (pasta bake, noodle dish, burrito bowls with rice written in), put it in `ingredients` with real amounts.
  - If the source is **meat/sauce-led** (no baked-in carb), do **not** invent a vague “pasta or bread to serve” line. Set `carbSideOptions` instead — a short list of recommended sides (`id`, `label`, `ingredients` for `basePortions`). The plan dropdown picks one; that side joins the shop.
- **~35g protein per portion** (see Protein floor above).
- **Tofu is never the main protein.** Optional as a small extra only if a meat dish already has proper meat.
- **Kit:** frying pan / wok, saucepan / pot, slow cooker, oven (metal tray or ceramic/clay lasagne-style dish). **Do not** write recipes that need a cast-iron / iron skillet as the hero cookware.
- **Thai basil** is hard to buy in the UK. Prefer Italian basil + a squeeze of lime, or mint + basil; note the substitute in the method. Do not rely on Thai basil alone.

### Protein swaps

Use when the same recipe is routinely cooked with another meat (ramen pork↔chicken, cowboy pasta pork↔turkey mince).

1. Set `protein` to the default.
2. Set `proteinOptions` to include that default plus alternatives.
3. Set `proteinOptionLabels` for clear chips (`Chicken`, `Turkey mince`).
4. Leave ingredient grams as for the default meat; the app renames mince/ground meat lines when the cook picks a swap.

Bacon and other fixed items stay as written.

### Local-only (not in JSON)

Star ratings and the active protein swap choice are saved in the browser (`localStorage` tag overlays). Re-publishing JSON does not wipe ratings unless the user clears site data.

### Regenerating from `recipes/*.md`

`python scripts/populate-recipes-from-md.py` can refresh JSON from study markdown. Prefer editing `public/recipes.json` directly for household truth. After markdown-driven populate, re-check couscous amounts, calories, and that no `householdNotes` crept back.
