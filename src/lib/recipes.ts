import type {
  EffectiveRecipe,
  Recipe,
  RecipeTagOverlay,
} from '../types'

export function mergeRecipe(
  recipe: Recipe,
  overlay?: RecipeTagOverlay,
): EffectiveRecipe {
  if (!overlay) return { ...recipe }
  return {
    ...recipe,
    cookTag: overlay.cookTag ?? recipe.cookTag,
    protein: overlay.protein ?? recipe.protein,
    indulgence: overlay.indulgence ?? recipe.indulgence,
    kidFriendly: overlay.kidFriendly ?? recipe.kidFriendly,
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
