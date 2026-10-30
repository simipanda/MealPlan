import type {
  EffectiveRecipe,
  IngredientUnit,
  MealSlot,
  ShopExtra,
  ShopSauceAdd,
} from '../types'
import { selectedCarbSide } from './carbSides'
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

function isLooseUnit(unit: IngredientUnit): boolean {
  return unit === 'toTaste' || unit === 'pinch'
}

/** toTaste still means buy it — house defaults for common aromatics. */
function shoppableFromLoose(
  name: string,
  unit: IngredientUnit,
): { name: string; qty: number; unit: IngredientUnit } | null {
  if (!isLooseUnit(unit)) return null
  const n = normalizeName(name)
  if (n === 'garlic' || n.startsWith('garlic ')) {
    return { name: 'Garlic', qty: 2, unit: 'clove' }
  }
  return null
}

function lineKey(name: string, unit: IngredientUnit): string {
  if (isLooseUnit(unit)) return `${normalizeName(name)}::loose`
  return `${normalizeName(name)}::${unit}`
}

function findCountableSameName(
  map: Map<string, ShopLine>,
  name: string,
): ShopLine | undefined {
  const n = normalizeName(name)
  for (const line of map.values()) {
    if (normalizeName(line.name) === n && !isLooseUnit(line.unit)) {
      return line
    }
  }
  return undefined
}

function addIngredient(
  map: Map<string, ShopLine>,
  name: string,
  qty: number | null,
  unit: IngredientUnit,
  sourceLabel: string,
) {
  // "Garlic, to taste" → still garlic: shop as cloves and merge with measured garlic
  const fromLoose = shoppableFromLoose(name, unit)
  if (fromLoose) {
    addIngredient(map, fromLoose.name, fromLoose.qty, fromLoose.unit, sourceLabel)
    return
  }

  if (isLooseUnit(unit)) {
    const countable = findCountableSameName(map, name)
    if (countable) {
      if (!countable.fromMeals.includes(sourceLabel)) {
        countable.fromMeals.push(sourceLabel)
      }
      return
    }
  }

  const key = lineKey(name, unit)
  const looseKey = `${normalizeName(name)}::loose`

  // Countable line absorbs a prior loose same-name row
  if (!isLooseUnit(unit) && map.has(looseKey)) {
    const loose = map.get(looseKey)!
    map.delete(looseKey)
    const cooks = [...loose.fromMeals]
    if (!cooks.includes(sourceLabel)) cooks.push(sourceLabel)
    map.set(key, {
      key,
      name,
      qty,
      unit,
      fromMeals: cooks,
    })
    return
  }

  const existing = map.get(key)
  if (existing) {
    if (existing.qty !== null && qty !== null) {
      existing.qty += qty
    } else if (existing.qty === null && qty !== null) {
      existing.qty = qty
      existing.unit = unit
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

    const side = selectedCarbSide(recipe, slot.carbSideId)
    if (side) {
      const sideLabel = `${mealLabel} · ${side.label}`
      for (const ing of side.ingredients) {
        const scaled = scaleQty(ing.qty, recipe.basePortions, slot.portions)
        addIngredient(map, ing.name, scaled, ing.unit, sideLabel)
      }
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
