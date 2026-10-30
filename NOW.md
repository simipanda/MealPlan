# NOW

## Goal

MealPlan PWA for Sim and Adam. Features for this version are done.

## Done

- Plan, randomise, locks, portions, shop, cook mode, filters, settings
- Live: https://simipanda.github.io/MealPlan/
- Recipes with photos; protein swaps; dressings & sauces + shop add-in
- Household rules in `docs/agents/recipes.md` (meat + carb, ~35g protein/portion, no tofu mains, no cast iron, Thai basil substitutes)
- **Per-portion macros** on meals: kcal + protein / carbs / fat (g), shown on recipe detail

## Next

Push `main` when you want GitHub Pages updated.

## Latest

- Macro panel on recipe detail; `proteinPerPortionG` / `carbsPerPortionG` / `fatPerPortionG` on meals
- Meat amounts bumped so dinners clear ~35g protein/portion (~125g chicken-equivalent)
- Midweek flavour pack + spice-sachet tacos already in the book

## Verify

1. Open any dinner → macros strip shows ~kcal and Protein / Carbs / Fat (g)
2. Spot-check a former thin dish (e.g. tuscan chicken, miso salmon) — meat grams raised; protein ≥ ~35g
3. Dressing (cilantro lime) has no 35g floor / may omit full macros
4. Recipes list / plan cards still show light `~N kcal/portion`
