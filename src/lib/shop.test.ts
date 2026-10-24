import { describe, expect, it } from 'vitest'
import type { EffectiveRecipe, MealSlot } from '../types'
import { buildShopLines } from './shop'

const recipes: EffectiveRecipe[] = [
  {
    id: 'a',
    title: 'A',
    basePortions: 2,
    totalMinutes: 30,
    cuisine: 'misc',
    method: [],
    cookTag: 'cook1',
    protein: 'veg',
    indulgence: 'light',
    kidFriendly: true,
    ingredients: [
      { name: 'Onion', qty: 1, unit: 'each' },
      { name: 'Stock', qty: 200, unit: 'ml' },
    ],
  },
  {
    id: 'b',
    title: 'B',
    basePortions: 2,
    totalMinutes: 40,
    cuisine: 'british',
    method: [],
    cookTag: 'cook2',
    protein: 'white',
    indulgence: 'light',
    kidFriendly: false,
    ingredients: [
      { name: 'onion', qty: 1, unit: 'each' },
      { name: 'Chicken', qty: 400, unit: 'g' },
    ],
  },
]

const slots: MealSlot[] = [
  {
    id: 'meal-1',
    cookId: 'cook1',
    recipeId: 'a',
    locked: true,
    portions: 4,
    coverDays: [0, 1],
  },
  {
    id: 'meal-2',
    cookId: 'cook2',
    recipeId: 'b',
    locked: true,
    portions: 4,
    coverDays: [3, 4],
  },
]

describe('buildShopLines', () => {
  it('merges same ingredient name+unit and scales portions', () => {
    const lines = buildShopLines(slots, recipes, {
      cook1: 'Sim',
      cook2: 'Adam',
    })
    const onion = lines.find((l) => l.name.toLowerCase() === 'onion')
    expect(onion?.qty).toBe(4)
    expect(onion?.fromMeals).toEqual(['Sim', 'Adam'])
    const chicken = lines.find((l) => l.name === 'Chicken')
    expect(chicken?.qty).toBe(800)
  })

  it('appends extras at the end', () => {
    const lines = buildShopLines(
      slots,
      recipes,
      { cook1: 'Sim', cook2: 'Adam' },
      [{ id: '1', label: 'Toilet paper' }],
    )
    expect(lines.at(-1)?.name).toBe('Toilet paper')
    expect(lines.at(-1)?.isExtra).toBe(true)
  })
})
