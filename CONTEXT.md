# MealPlan

A mobile-first PWA for a two-cook household recipe book and weekly dinner plan.

## Glossary

- **Household** — two cooks, week-start day, no-repeat window, and schedule defaults.
- **Cook** — a named person with a default cook day, coverage days, and portion count.
- **Recipe** — a published dish in `recipes.json`, optionally with local tag overlays. Includes cuisine, total cook minutes (prep+cook), an optional source link, household change notes, and an optional admin thumbnail under `public/images/recipes/`.
- **Household notes** — how this house changed a dish. Shown under the ingredients. The original page stays the source for the full method.
- **Cuisine** — one style tag per recipe (Mexican, Italian, British, …, Misc) for browse/filter/search.
- **Cook time band** — Easy ≤30 min, Medium 31–60, Hard 61+ (derived from `totalMinutes`).
- **Week plan** — one week’s Meal 1 / Meal 2 assignments plus this-week overrides.
- **Meal slot** — one cook’s recipe for the week (lockable; portions and cover days overridable).
- **Coverage days** — evenings that meal feeds (cook night plus reheats).
- **People per meal** — typical diners per evening; used to map portions ↔ coverage evenings (evenings ≈ portions ÷ people).
- **Shop list** — merged scaled ingredients for the week plus ephemeral extras.

Coverage evenings cannot overlap between meals. Changing portions updates that meal’s cook/reheat nights on the week strip; changing coverage updates portions (evenings × people). Ingredients scale to the meal’s portion count.


## Decisions

- Published recipes live in `public/recipes.json` and ship with GitHub Pages deploys.
- Living state (plan, history, tags, shop, prefs, household) lives in `localStorage`.
- In-app recipe editing is tags only in v1 (cook, indulgence, kid-friendly); protein, cuisine, minutes, notes, source links, and images are set in `recipes.json` / static assets by admins and are not editable in the app. New recipes come from JSON updates. Missing images show a protein-coloured placeholder. Full methods stay on the original page; the app stores the link and this house’s changes.
- Recipe detail and cook/shop views scale ingredients to this week’s meal-slot portions when the recipe is on the plan.

- Randomise never silently reuses a recipe blocked by history or health rules.
- Once-per-week is per protein type. Default ticks everything except poultry (chicken and turkey share that category and may repeat). Beef + pork in the same week is allowed; the Plan shows a soft red-meat warning when both appear.
