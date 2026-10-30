import {
  isRedMeat,
  PROTEIN_LABELS,
  RED_MEAT_PROTEINS,
} from '../data/proteinIcons'
import { isMealRecipe } from './recipes'
import type {
  CookId,
  CookTag,
  EffectiveRecipe,
  MealSlot,
  Protein,
} from '../types'

export interface RandomiseInput {
  recipes: EffectiveRecipe[]
  slots: MealSlot[]
  slotIndex: number
  blockedRecipeIds: Set<string>
  /** Proteins allowed at most once each per week. */
  oncePerWeekProteins: Protein[]
}

export type RandomiseResult =
  | { ok: true; recipeId: string; poolSize: number }
  | { ok: false; reason: 'empty_pool'; poolSize: 0 }

function cookMatches(tag: CookTag, cookId: CookId): boolean {
  return tag === 'either' || tag === cookId
}

function lockedConstraints(
  slots: MealSlot[],
  recipes: EffectiveRecipe[],
  exceptIndex: number,
  oncePerWeekProteins: Protein[],
) {
  const limited = new Set(oncePerWeekProteins)
  const usedLimited = new Set<Protein>()
  let hasRich = false
  const usedIds = new Set<string>()

  slots.forEach((slot, i) => {
    if (i === exceptIndex) return
    if (!slot.recipeId) return
    usedIds.add(slot.recipeId)
    const recipe = recipes.find((r) => r.id === slot.recipeId)
    if (!recipe) return
    if (limited.has(recipe.protein)) usedLimited.add(recipe.protein)
    if (recipe.indulgence === 'rich') hasRich = true
  })

  return { usedLimited, hasRich, usedIds, limited }
}

export function candidatePool(input: RandomiseInput): EffectiveRecipe[] {
  const slot = input.slots[input.slotIndex]
  if (!slot) return []

  const { usedLimited, hasRich, usedIds, limited } = lockedConstraints(
    input.slots,
    input.recipes,
    input.slotIndex,
    input.oncePerWeekProteins,
  )

  return input.recipes.filter((recipe) => {
    if (!isMealRecipe(recipe)) return false
    if (!cookMatches(recipe.cookTag, slot.cookId)) return false
    if (input.blockedRecipeIds.has(recipe.id)) return false
    if (usedIds.has(recipe.id)) return false
    if (limited.has(recipe.protein) && usedLimited.has(recipe.protein)) {
      return false
    }
    if (hasRich && recipe.indulgence === 'rich') return false
    return true
  })
}

export function pickRandomRecipe(
  input: RandomiseInput,
  random: () => number = Math.random,
): RandomiseResult {
  const pool = candidatePool(input)
  if (pool.length === 0) {
    return { ok: false, reason: 'empty_pool', poolSize: 0 }
  }
  const index = Math.floor(random() * pool.length)
  const recipe = pool[Math.min(index, pool.length - 1)]!
  return { ok: true, recipeId: recipe.id, poolSize: pool.length }
}

export function randomiseUnlockedSlots(
  recipes: EffectiveRecipe[],
  slots: MealSlot[],
  blockedRecipeIds: Set<string>,
  oncePerWeekProteins: Protein[],
  random: () => number = Math.random,
): { slots: MealSlot[]; errors: { slotId: string; cookId: CookId; reason: string }[] } {
  const next = slots.map((s) => ({
    ...s,
    coverDays: [...s.coverDays],
  }))
  const errors: { slotId: string; cookId: CookId; reason: string }[] = []

  for (let i = 0; i < next.length; i++) {
    const slot = next[i]!
    if (slot.locked && slot.recipeId) continue

    const result = pickRandomRecipe(
      {
        recipes,
        slots: next,
        slotIndex: i,
        blockedRecipeIds,
        oncePerWeekProteins,
      },
      random,
    )

    if (!result.ok) {
      next[i] = { ...slot, recipeId: null, locked: false }
      errors.push({
        slotId: slot.id,
        cookId: slot.cookId,
        reason: 'No recipes left under current rules',
      })
      continue
    }

    next[i] = { ...slot, recipeId: result.recipeId, locked: false }
  }

  return { slots: next, errors }
}

/**
 * Soft warning when the plan has more than one red meat (beef/lamb/pork).
 * Does not block randomise or picks — locks can intentionally keep both.
 */
export function redMeatConflictWarning(
  slots: MealSlot[],
  recipes: EffectiveRecipe[],
  oncePerWeekProteins: Protein[],
): string | null {
  // Only warn when at least one red meat is in the once-per-week list
  // (household cares about red meat limits).
  const caresAboutRed = oncePerWeekProteins.some((p) => isRedMeat(p))
  if (!caresAboutRed) return null

  const found: { label: string; title: string }[] = []
  for (const slot of slots) {
    if (!slot.recipeId) continue
    const recipe = recipes.find((r) => r.id === slot.recipeId)
    if (!recipe || !isRedMeat(recipe.protein)) continue
    found.push({
      label: PROTEIN_LABELS[recipe.protein],
      title: recipe.title,
    })
  }

  if (found.length < 2) return null
  const list = found.map((f) => `${f.label} (${f.title})`).join(' and ')
  return `More than one red meat this week: ${list}. Fine if you meant to — unlock or swap a meal if not.`
}

export type PickBlockKind =
  | 'already_planned'
  | 'recent_history'
  | 'protein_limit'
  | 'rich'
  | 'wrong_cook'
  | 'not_a_meal'
  | 'unavailable'

export type ManualPickStatus =
  | { ok: true; current?: boolean }
  | {
      ok: false
      reason: string
      kind: PickBlockKind
      allowCookOverride?: boolean
    }

export interface ManualPickOptions {
  overrideCookTag?: boolean
}

export function manualPickStatus(
  recipe: EffectiveRecipe,
  input: RandomiseInput,
  options: ManualPickOptions = {},
): ManualPickStatus {
  const slot = input.slots[input.slotIndex]
  if (!slot) return { ok: false, reason: 'No meal slot', kind: 'unavailable' }

  if (slot.recipeId === recipe.id) {
    return { ok: true, current: true }
  }

  if (!isMealRecipe(recipe)) {
    return {
      ok: false,
      reason: 'Dressing / sauce — not for the meal plan',
      kind: 'not_a_meal',
    }
  }

  const { usedLimited, hasRich, usedIds, limited } = lockedConstraints(
    input.slots,
    input.recipes,
    input.slotIndex,
    input.oncePerWeekProteins,
  )

  if (usedIds.has(recipe.id)) {
    return {
      ok: false,
      reason: 'Already on this week’s plan',
      kind: 'already_planned',
    }
  }
  if (input.blockedRecipeIds.has(recipe.id)) {
    return {
      ok: false,
      reason: 'Used in recent weeks',
      kind: 'recent_history',
    }
  }
  if (limited.has(recipe.protein) && usedLimited.has(recipe.protein)) {
    return {
      ok: false,
      reason: `${PROTEIN_LABELS[recipe.protein]} already planned this week`,
      kind: 'protein_limit',
    }
  }
  if (hasRich && recipe.indulgence === 'rich') {
    return {
      ok: false,
      reason: 'Rich meal already planned this week',
      kind: 'rich',
    }
  }

  const cookOk =
    options.overrideCookTag || cookMatches(recipe.cookTag, slot.cookId)
  if (!cookOk) {
    return {
      ok: false,
      reason: 'Not tagged for this cook',
      allowCookOverride: true,
      kind: 'wrong_cook',
    }
  }

  return { ok: true }
}

export { isRedMeat, RED_MEAT_PROTEINS }
