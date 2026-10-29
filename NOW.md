# NOW

## Goal

MealPlan PWA for Sim and Adam. Features for this version are done.

## Done

- Plan, randomise, locks, portions linked to the week strip
- Recipes, filters, cook time, cuisine, cook mode, shop
- Settings: meals per week, once-per-week (all ticked except poultry)
- Soft red-meat warning; scroll opens each screen at the top
- Live: https://simipanda.github.io/MealPlan/
- Repo: https://github.com/simipanda/MealPlan (public read, only this account can edit)
- Phone check passed

## Next

Household recipe cards are in `public/recipes.json` (titles, links, our changes). Amounts and full methods stay on the original page via the Original recipe button.

Still to do when wanted: type our own ingredient amounts into the JSON so shop and portion scaling work, add photos, and confirm guessed proteins on the name-only soups. Then push `main`.

No new features unless the scope changes.

## Verify

1. Reopen the installed app after a deploy
2. Randomise, lock, portions vs week strip, shop, cook units
3. Settings → Once per week: poultry unticked, everything else ticked
