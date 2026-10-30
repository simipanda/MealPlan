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
    baseProtein: 'veg',
    rating: null,
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
    baseProtein: 'white',
    rating: null,
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

  it('treats toTaste garlic as real garlic (cloves) and merges with measured', () => {
    const withGarlic: EffectiveRecipe[] = [
      {
        ...recipes[0]!,
        id: 'soup',
        ingredients: [
          { name: 'Garlic', qty: null, unit: 'toTaste' },
          { name: 'Stock', qty: 200, unit: 'ml' },
        ],
      },
      {
        ...recipes[1]!,
        id: 'tacos',
        ingredients: [
          { name: 'Garlic', qty: 2, unit: 'clove' },
          { name: 'Beef mince', qty: 500, unit: 'g' },
        ],
      },
    ]
    const lines = buildShopLines(
      [
        { ...slots[0]!, recipeId: 'soup' },
        { ...slots[1]!, recipeId: 'tacos' },
      ],
      withGarlic,
      { cook1: 'Sim', cook2: 'Adam' },
    )
    const garlicLines = lines.filter((l) => l.name.toLowerCase() === 'garlic')
    expect(garlicLines).toHaveLength(1)
    expect(garlicLines[0]?.unit).toBe('clove')
    // toTaste → 2 cloves + taco 2×(4/2) = 4 → 6 total
    expect(garlicLines[0]?.qty).toBe(6)
    expect(garlicLines[0]?.fromMeals).toEqual(['Sim', 'Adam'])
  })

  it('adds the selected side carb to the shop (defaults to first option)', () => {
    const withSides: EffectiveRecipe = {
      ...recipes[0]!,
      id: 'chasseur',
      ingredients: [{ name: 'Chicken', qty: 500, unit: 'g' }],
      carbSideOptions: [
        {
          id: 'crusty-bread',
          label: 'Crusty bread',
          ingredients: [{ name: 'Crusty bread', qty: 1, unit: 'each' }],
        },
        {
          id: 'couscous',
          label: 'Couscous',
          ingredients: [{ name: 'Couscous (dry)', qty: 280, unit: 'g' }],
        },
      ],
    }
    const defaulted = buildShopLines(
      [{ ...slots[0]!, recipeId: 'chasseur', portions: 2 }],
      [withSides],
      { cook1: 'Sim', cook2: 'Adam' },
    )
    expect(defaulted.find((l) => l.name === 'Crusty bread')?.qty).toBe(1)
    expect(defaulted.find((l) => l.name === 'Couscous (dry)')).toBeUndefined()

    const picked = buildShopLines(
      [
        {
          ...slots[0]!,
          recipeId: 'chasseur',
          portions: 4,
          carbSideId: 'couscous',
        },
      ],
      [withSides],
      { cook1: 'Sim', cook2: 'Adam' },
    )
    // 280g for base 2 → ×2 for 4 portions
    expect(picked.find((l) => l.name === 'Couscous (dry)')?.qty).toBe(560)
    expect(picked.find((l) => l.name === 'Crusty bread')).toBeUndefined()
  })

  it('lists toTaste-only garlic as cloves so it still appears to buy', () => {
    const onlyLoose: EffectiveRecipe[] = [
      {
        ...recipes[0]!,
        id: 'soup',
        ingredients: [{ name: 'Garlic', qty: null, unit: 'toTaste' }],
      },
    ]
    const lines = buildShopLines(
      [{ ...slots[0]!, recipeId: 'soup' }],
      onlyLoose,
      { cook1: 'Sim', cook2: 'Adam' },
    )
    const garlic = lines.find((l) => l.name.toLowerCase() === 'garlic')
    expect(garlic?.unit).toBe('clove')
    expect(garlic?.qty).toBe(2)
    expect(garlic?.fromMeals).toEqual(['Sim'])
  })

  it('merges sauce ingredients into the shop without planning them', () => {
    const dressing: EffectiveRecipe = {
      id: 'dressing',
      title: 'Cilantro lime dressing',
      basePortions: 2,
      totalMinutes: 10,
      cuisine: 'mexican',
      method: [],
      cookTag: 'either',
      protein: 'veg',
      baseProtein: 'veg',
      rating: null,
      catalog: 'sauce',
      indulgence: 'light',
      kidFriendly: true,
      ingredients: [
        { name: 'Lime juice', qty: 60, unit: 'ml' },
        { name: 'Onion', qty: 0.5, unit: 'each' },
      ],
    }
    const lines = buildShopLines(
      slots,
      [...recipes, dressing],
      { cook1: 'Sim', cook2: 'Adam' },
      [],
      [{ recipeId: 'dressing', portions: 2 }],
    )
    const lime = lines.find((l) => l.name === 'Lime juice')
    expect(lime?.qty).toBe(60)
    expect(lime?.fromMeals).toContain('Cilantro lime dressing')
    const onion = lines.find((l) => l.name.toLowerCase() === 'onion')
    // meals: 4 + sauce: 0.5
    expect(onion?.qty).toBe(4.5)
  })
})
