import type {
  EffectiveRecipe,
  Recipe,
  RecipeCatalog,
  RecipeTagOverlay,
} from '../types'
import { ingredientsForProtein } from './proteinSwap'

export function recipeCatalog(recipe: Pick<Recipe, 'catalog'>): RecipeCatalog {
  return recipe.catalog ?? 'meal'
}

/** Dinners that may appear on the week plan / randomise. */
export function isMealRecipe(recipe: Pick<Recipe, 'catalog'>): boolean {
  return recipeCatalog(recipe) === 'meal'
}

/** Dressings, sauces, condiments — book only, never planned. */
export function isSauceRecipe(recipe: Pick<Recipe, 'catalog'>): boolean {
  return recipeCatalog(recipe) === 'sauce'
}

function clampRating(rating: number | undefined): number | null {
  if (rating == null || rating <= 0) return null
  return Math.min(5, Math.max(1, Math.round(rating)))
}

export function mergeRecipe(
  recipe: Recipe,
  overlay?: RecipeTagOverlay,
): EffectiveRecipe {
  const activeProtein = overlay?.protein ?? recipe.protein
  const ingredients = ingredientsForProtein(
    recipe.ingredients,
    recipe,
    activeProtein,
  )
  return {
    ...recipe,
    catalog: recipeCatalog(recipe),
    cookTag: overlay?.cookTag ?? recipe.cookTag,
    protein: activeProtein,
    baseProtein: recipe.protein,
    indulgence: overlay?.indulgence ?? recipe.indulgence,
    kidFriendly: overlay?.kidFriendly ?? recipe.kidFriendly,
    rating: clampRating(overlay?.rating),
    ingredients,
  }
}

export function mergeAllRecipes(
  recipes: Recipe[],
  overlays: Record<string, RecipeTagOverlay>,
): EffectiveRecipe[] {
  return recipes.map((r) => mergeRecipe(r, overlays[r.id]))
}

export async function loadRecipes(baseUrl: string): Promise<Recipe[]> {
  const url = `${baseUrl}recipes.json`.replace(/([^:]\/)\/+/g, '$1')
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load recipes.json (${res.status})`)
  }
  const data = (await res.json()) as Recipe[]
  if (!Array.isArray(data)) {
    throw new Error('recipes.json must be an array')
  }
  return data
}
