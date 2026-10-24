# NOW

## Goal

Ship a usable MealPlan PWA on GitHub Pages for Sim & Adam’s Sunday dinner shop.

## Done

- Vite + React + TS + Tailwind + PWA manifest/icons + GH Pages workflow
- Domain docs (`CONTEXT.md`), demo `recipes.json` (12 recipes)
- Unit conversion, portion scaling, shop merge, randomiser rules + tests
- Screens: Plan, Recipes + tags, Cook mode, Shop, Settings
- Variable meals/week + once-per-week protein categories
- Recipe `totalMinutes` (Easy/Medium/Hard), thumbnails + placeholders, Recipes filters
- Cuisine tag (16 styles) on recipes — filter, search, list/detail chips

## Next

- Push repo and enable GitHub Pages (Actions)
- Admin: add real photos under `public/images/recipes/` and set `image` in JSON
- Desktop smoke on Pages URL, then Samsung Add to Home screen

## Verify

1. `npm test` and `npm run build`
2. Recipes: cuisine filter + search “indian” / “thai”; other filters still work
3. Pick recipe from Plan — filters still show crossed-out blocked items
4. Recipe detail shows cuisine + cook time
5. Settings once/week + meal templates still work
