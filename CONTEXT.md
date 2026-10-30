# MealPlan

A mobile-first PWA for a two-cook household recipe book and weekly dinner plan.

## Glossary

- **Household** — two cooks, week-start day, no-repeat window, and schedule defaults.
- **Cook** — a named person with a default cook day, coverage days, and portion count.
- **Recipe** — a published dish in `recipes.json`, optionally with local tag overlays. Includes cuisine, total cook minutes (prep+cook), ingredients, method, **calories per portion** (one plate, not the whole pot), an optional source link, optional protein swaps, and an optional admin thumbnail under `public/images/recipes/`. How this house cooks the dish is written into ingredients and method (no separate notes field).
- **Protein swap** — optional alternate meats on a recipe (e.g. pork ↔ chicken). Amounts stay the same; the active choice is stored locally and drives once-per-week protein rules and shop meat names.
- **Star rating** — local 1–5 rating per recipe (this device only).
- **Cuisine** — one style tag per recipe (Mexican, Italian, British, …, Misc) for browse/filter/search.
- **Cook time band** — Easy ≤30 min, Medium 31–60, Hard 61+ (derived from `totalMinutes`).
- **Week plan** — one week’s Meal 1 / Meal 2 assignments plus this-week overrides.
- **Meal slot** — one cook’s recipe for the week (lockable; portions and cover days overridable).
- **Coverage days** — evenings that meal feeds (cook night plus reheats).
- **People per meal** — typical diners per evening; used to map portions ↔ coverage evenings (evenings ≈ portions ÷ people).
- **Shop list** — merged scaled ingredients for the week’s meals, plus optional book sauces/dressings pulled in for the week, plus ephemeral extras.
- **Dressings & sauces** — `catalog: "sauce"` recipes. Not on the meal plan; can still push ingredients into the current shop.

Coverage evenings cannot overlap between meals. Changing portions updates that meal’s cook/reheat nights on the week strip; changing coverage updates portions (evenings × people). Ingredients scale to the meal’s portion count.


## Decisions

- Published recipes live in `public/recipes.json` and ship with GitHub Pages deploys.
- Living state (plan, history, tags, shop, prefs, household) lives in `localStorage`.
- In-app recipe editing is tags (cook, indulgence, kid-friendly), local star rating, and protein swap when `proteinOptions` is set on the recipe. Cuisine, minutes, ingredients, method, calories, source links, images, and which swaps exist are set in `recipes.json` / static assets. See `docs/agents/recipes.md`. Missing images show a protein-coloured placeholder. Original recipe link is optional reference.
- Recipe detail and cook/shop views scale ingredients to this week’s meal-slot portions when the recipe is on the plan.

- Randomise never silently reuses a recipe blocked by history or health rules.
- Once-per-week is per protein type. Default ticks everything except poultry (chicken and turkey share that category and may repeat). Beef + pork in the same week is allowed; the Plan shows a soft red-meat warning when both appear.
