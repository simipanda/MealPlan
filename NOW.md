# NOW

## Goal

Usable MealPlan PWA on GitHub Pages for Sim & Adam’s dinner shop. Shipped.

## Done

- Plan, recipes, shop, cook, settings, filters, portions ↔ week strip, red-meat warning
- Scroll always starts at the top of a screen
- Once-per-week default: all proteins except poultry (chicken and turkey share poultry)
- Repo: https://github.com/simipanda/MealPlan
- Live: https://simipanda.github.io/MealPlan/
- Phone check (Sim + partner) passed

## Next

- Add real dishes in `public/recipes.json` (cuisine, `totalMinutes`, protein, tags)
- Optional photos in `public/images/recipes/` plus `"image"` on each recipe, then push `main` to redeploy

## Verify

1. Open https://simipanda.github.io/MealPlan/ (reopen the installed app after a deploy)
2. Randomise, lock, portions vs week strip, shop, cook units
3. Settings → Once per week: poultry unticked, the rest ticked
