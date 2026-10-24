# MealPlan

Mobile-first PWA for a two-cook household recipe book and weekly dinner plan. Hosted on GitHub Pages.

## Local

```bash
npm install
npm run dev
npm test
npm run build
```

Open the Vite URL on desktop first. For GitHub Pages path testing locally, `npm run build && npm run preview`.

## GitHub Pages

1. Push to `main` / `master` (workflow in `.github/workflows/deploy.yml`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. App URL: `https://<user>.github.io/MealPlan/`

## Data

- Recipes: `public/recipes.json` (edit & redeploy).
- Plan, shop, tags, household: browser `localStorage`.
