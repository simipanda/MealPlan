import type { CarbSideOption, EffectiveRecipe, Recipe } from '../types'

export function carbSideOptions(
  recipe: Pick<Recipe, 'carbSideOptions'> | null | undefined,
): CarbSideOption[] {
  return recipe?.carbSideOptions ?? []
}

export function defaultCarbSideId(
  recipe: Pick<Recipe, 'carbSideOptions'> | null | undefined,
): string | null {
  return carbSideOptions(recipe)[0]?.id ?? null
}

export function selectedCarbSide(
  recipe: Pick<Recipe, 'carbSideOptions'> | null | undefined,
  carbSideId: string | null | undefined,
): CarbSideOption | null {
  const opts = carbSideOptions(recipe)
  if (!opts.length) return null
  return opts.find((o) => o.id === carbSideId) ?? opts[0] ?? null
}

export function recipeNeedsCarbSide(
  recipe: Pick<Recipe, 'carbSideOptions'> | EffectiveRecipe | null | undefined,
): boolean {
  return carbSideOptions(recipe).length > 0
}
