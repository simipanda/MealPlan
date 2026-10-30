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
      caloriesPerPortion: 250,
      proteinPerPortionG: 5,
      carbsPerPortionG: 55,
      fatPerPortionG: 1,
    },
    {
      id: 'couscous',
      label: 'Couscous',
      ingredients: [{ name: 'Couscous', qty: 280, unit: 'g' as const }],
      caloriesPerPortion: 220,
      proteinPerPortionG: 8,
      carbsPerPortionG: 45,
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
      caloriesPerPortion: 650,
      proteinPerPortionG: 45,
      carbsPerPortionG: 65,
      fatPerPortionG: 21,
    })
  })

  it('swaps plate macros when a different side is selected', () => {
    expect(portionMacros(base, 'couscous')).toEqual({
      caloriesPerPortion: 620,
      proteinPerPortionG: 48,
      carbsPerPortionG: 55,
      fatPerPortionG: 21,
    })
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
