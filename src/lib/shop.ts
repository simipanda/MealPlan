import type {
  EffectiveRecipe,
  IngredientUnit,
  MealSlot,
  ShopExtra,
  ShopSauceAdd,
} from '../types'
import { isSauceRecipe } from './recipes'
import { scaleQty } from './units'

export interface ShopLine {
  key: string
  name: string
  qty: number | null
  unit: IngredientUnit
  fromMeals: string[]
  isExtra?: boolean
  extraId?: string
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function lineKey(name: string, unit: IngredientUnit): string {
  return `${normalizeName(name)}::${unit}`
}

function addIngredient(
  map: Map<string, ShopLine>,
  name: string,
  qty: number | null,
  unit: IngredientUnit,
  sourceLabel: string,
) {
  const key = lineKey(name, unit)
  const existing = map.get(key)
  if (existing) {
    if (existing.qty !== null && qty !== null) {
      existing.qty += qty
    }
    if (!existing.fromMeals.includes(sourceLabel)) {
      existing.fromMeals.push(sourceLabel)
    }
  } else {
    map.set(key, {
      key,
      name,
      qty,
      unit,
      fromMeals: [sourceLabel],
    })
  }
}

export function buildShopLines(
  slots: MealSlot[],
  recipes: EffectiveRecipe[],
  mealLabels: Record<string, string>,
  extras: ShopExtra[] = [],
  sauces: ShopSauceAdd[] = [],
): ShopLine[] {
  const map = new Map<string, ShopLine>()

  for (const slot of slots) {
    if (!slot.recipeId) continue
    const recipe = recipes.find((r) => r.id === slot.recipeId)
    if (!recipe || isSauceRecipe(recipe)) continue
    const mealLabel = mealLabels[slot.cookId] ?? slot.cookId

    for (const ing of recipe.ingredients) {
      const scaled = scaleQty(ing.qty, recipe.basePortions, slot.portions)
      addIngredient(map, ing.name, scaled, ing.unit, mealLabel)
    }
  }

  for (const add of sauces) {
    const recipe = recipes.find((r) => r.id === add.recipeId)
    if (!recipe || !isSauceRecipe(recipe)) continue
    const label = recipe.title
    const portions = add.portions > 0 ? add.portions : recipe.basePortions
    for (const ing of recipe.ingredients) {
      const scaled = scaleQty(ing.qty, recipe.basePortions, portions)
      addIngredient(map, ing.name, scaled, ing.unit, label)
    }
  }

  const lines = [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )

  for (const extra of extras) {
    lines.push({
      key: `extra::${extra.id}`,
      name: extra.label,
      qty: null,
      unit: 'each',
      fromMeals: [],
      isExtra: true,
      extraId: extra.id,
    })
  }

  return lines
}
