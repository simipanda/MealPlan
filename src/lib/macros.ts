import { selectedCarbSide } from './carbSides'
import type { CarbSideOption, Recipe } from '../types'

export type PortionMacros = {
  caloriesPerPortion: number | null
  proteinPerPortionG: number | null
  carbsPerPortionG: number | null
  fatPerPortionG: number | null
}

type MacroSource = Pick<
  Recipe,
  | 'caloriesPerPortion'
  | 'proteinPerPortionG'
  | 'carbsPerPortionG'
  | 'fatPerPortionG'
  | 'carbSideOptions'
>

function num(n: number | null | undefined): number | null {
  return n == null || Number.isNaN(n) ? null : n
}

function addNullable(
  base: number | null | undefined,
  extra: number | null | undefined,
): number | null {
  if (base == null && extra == null) return null
  return Math.round((base ?? 0) + (extra ?? 0))
}

function sideMacros(side: CarbSideOption | null): PortionMacros {
  if (!side) {
    return {
      caloriesPerPortion: null,
      proteinPerPortionG: null,
      carbsPerPortionG: null,
      fatPerPortionG: null,
    }
  }
  return {
    caloriesPerPortion: num(side.caloriesPerPortion),
    proteinPerPortionG: num(side.proteinPerPortionG),
    carbsPerPortionG: num(side.carbsPerPortionG),
    fatPerPortionG: num(side.fatPerPortionG),
  }
}

/**
 * Per-portion macros for the plate: recipe base + selected side carb (if any).
 * Recipes with `carbSideOptions` store macros for the meat/sauce only; the side
 * carries its own per-portion macros. No sides → recipe macros unchanged.
 */
export function portionMacros(
  recipe: MacroSource | null | undefined,
  carbSideId?: string | null,
): PortionMacros {
  if (!recipe) {
    return {
      caloriesPerPortion: null,
      proteinPerPortionG: null,
      carbsPerPortionG: null,
      fatPerPortionG: null,
    }
  }

  const base: PortionMacros = {
    caloriesPerPortion: num(recipe.caloriesPerPortion),
    proteinPerPortionG: num(recipe.proteinPerPortionG),
    carbsPerPortionG: num(recipe.carbsPerPortionG),
    fatPerPortionG: num(recipe.fatPerPortionG),
  }

  const opts = recipe.carbSideOptions ?? []
  if (!opts.length) return base

  const side = sideMacros(selectedCarbSide(recipe, carbSideId))
  return {
    caloriesPerPortion: addNullable(
      base.caloriesPerPortion,
      side.caloriesPerPortion,
    ),
    proteinPerPortionG: addNullable(
      base.proteinPerPortionG,
      side.proteinPerPortionG,
    ),
    carbsPerPortionG: addNullable(
      base.carbsPerPortionG,
      side.carbsPerPortionG,
    ),
    fatPerPortionG: addNullable(base.fatPerPortionG, side.fatPerPortionG),
  }
}
