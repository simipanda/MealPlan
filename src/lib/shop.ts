import type { EffectiveRecipe, IngredientUnit, MealSlot, ShopExtra } from '../types'
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

export function buildShopLines(
  slots: MealSlot[],
  recipes: EffectiveRecipe[],
  mealLabels: Record<string, string>,
  extras: ShopExtra[] = [],
): ShopLine[] {
  const map = new Map<string, ShopLine>()

  for (const slot of slots) {
    if (!slot.recipeId) continue
    const recipe = recipes.find((r) => r.id === slot.recipeId)
    if (!recipe) continue
    const mealLabel = mealLabels[slot.cookId] ?? slot.cookId

    for (const ing of recipe.ingredients) {
      const key = lineKey(ing.name, ing.unit)
      const scaled = scaleQty(ing.qty, recipe.basePortions, slot.portions)
      const existing = map.get(key)
      if (existing) {
        if (existing.qty !== null && scaled !== null) {
          existing.qty += scaled
        }
        if (!existing.fromMeals.includes(mealLabel)) {
          existing.fromMeals.push(mealLabel)
        }
      } else {
        map.set(key, {
          key,
          name: ing.name,
          qty: scaled,
          unit: ing.unit,
          fromMeals: [mealLabel],
        })
      }
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
