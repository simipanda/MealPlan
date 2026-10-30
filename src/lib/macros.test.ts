import { describe, expect, it } from 'vitest'
import { portionMacros } from './macros'
import type { Recipe } from '../types'

const base = {
  caloriesPerPortion: 400,
  proteinPerPortionG: 40,
  carbsPerPortionG: 10,
  fatPerPortionG: 20,
  carbSideOptions: [
    {
      id: 'rice',
      label: 'Rice',
      ingredients: [{ name: 'Rice', qty: 280, unit: 'g' as const }],
      caloriesPerPortion: 253,
      proteinPerPortionG: 5,
      carbsPerPortionG: 56,
      fatPerPortionG: 1,
    },
    {
      id: 'couscous',
      label: 'Couscous',
      ingredients: [{ name: 'Couscous', qty: 280, unit: 'g' as const }],
      caloriesPerPortion: 249,
      proteinPerPortionG: 9,
      carbsPerPortionG: 51,
      fatPerPortionG: 1,
    },
  ],
} satisfies Pick<
  Recipe,
  | 'caloriesPerPortion'
  | 'proteinPerPortionG'
  | 'carbsPerPortionG'
  | 'fatPerPortionG'
  | 'carbSideOptions'
>

describe('portionMacros', () => {
  it('adds the default (first) side when no id is chosen', () => {
    expect(portionMacros(base)).toEqual({
      caloriesPerPortion: 653,
      proteinPerPortionG: 45,
      carbsPerPortionG: 66,
      fatPerPortionG: 21,
    })
  })

  it('swaps plate macros when a different side is selected', () => {
    const rice = portionMacros(base, 'rice')
    const couscous = portionMacros(base, 'couscous')
    expect(couscous).toEqual({
      caloriesPerPortion: 649,
      proteinPerPortionG: 49,
      carbsPerPortionG: 61,
      fatPerPortionG: 21,
    })
    // Same dry weight ≈ similar kcal; carbs/protein must still move.
    expect(couscous.carbsPerPortionG).not.toBe(rice.carbsPerPortionG)
    expect(couscous.proteinPerPortionG).not.toBe(rice.proteinPerPortionG)
  })

  it('leaves macros alone when the recipe has no side options', () => {
    const plain = {
      caloriesPerPortion: 500,
      proteinPerPortionG: 35,
      carbsPerPortionG: 40,
      fatPerPortionG: 15,
    }
    expect(portionMacros(plain)).toEqual({
      caloriesPerPortion: 500,
      proteinPerPortionG: 35,
      carbsPerPortionG: 40,
      fatPerPortionG: 15,
    })
  })
})
