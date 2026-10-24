import { DEFAULT_HOUSEHOLD, DEFAULT_PREFS } from '../data/defaultHousehold'
import type {
  Cook,
  DayIndex,
  Household,
  MealTemplate,
  PlanHistoryEntry,
  Prefs,
  Protein,
  RecipeTagOverlay,
  ShopState,
  WeekPlan,
} from '../types'
import { createEmptyWeekPlan, newMealSlotId } from './week'

const KEYS = {
  household: 'mealplan.household',
  weekPlan: 'mealplan.weekPlan',
  history: 'mealplan.planHistory',
  tags: 'mealplan.tagOverrides',
  shop: 'mealplan.shop',
  prefs: 'mealplan.prefs',
} as const

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

const LEGACY_ONCE_PER_WEEK: Protein[] = ['red', 'lamb', 'pork']

function sameProteins(a: Protein[], b: Protein[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((p) => set.has(p))
}

/** Old starter was beef/lamb/pork only. Move that exact set to the new default. */
function migrateOncePerWeek(
  stored: Protein[] | undefined,
  fallback: Protein[],
): Protein[] {
  if (!stored?.length) return [...fallback]
  if (sameProteins(stored, LEGACY_ONCE_PER_WEEK)) return [...fallback]
  return [...stored]
}

/** Migrate older household shapes (cook-level schedule → mealTemplates). */
export function normalizeHousehold(raw: Partial<Household> | null): Household {
  const base = structuredClone(DEFAULT_HOUSEHOLD)
  if (!raw?.cooks?.length) return base

  const cooks: [Cook, Cook] = [
    {
      id: 'cook1',
      name: (raw.cooks[0] as Cook & { cookDay?: number })?.name ?? 'Sim',
    },
    {
      id: 'cook2',
      name: (raw.cooks[1] as Cook & { cookDay?: number })?.name ?? 'Adam',
    },
  ]

  let mealTemplates = raw.mealTemplates
  if (!mealTemplates?.length) {
    // Legacy: schedule lived on cook objects
    const legacy = raw.cooks as Array<
      Cook & { cookDay?: DayIndex; coverDays?: DayIndex[]; portions?: number }
    >
    mealTemplates = legacy.map((c, i): MealTemplate => ({
      id: `meal-${c.id}`,
      cookId: c.id,
      coverDays:
        c.coverDays && c.coverDays.length > 0
          ? [...c.coverDays]
          : c.cookDay != null
            ? [c.cookDay]
            : [i === 0 ? 0 : 3],
      portions: c.portions ?? (i === 0 ? 6 : 4),
    }))
  }

  const oncePerWeekProteins = migrateOncePerWeek(
    raw.oncePerWeekProteins,
    base.oncePerWeekProteins,
  )

  return {
    cooks,
    weekStartDay: raw.weekStartDay ?? base.weekStartDay,
    noRepeatWeeks: raw.noRepeatWeeks ?? base.noRepeatWeeks,
    peoplePerMeal: raw.peoplePerMeal ?? base.peoplePerMeal,
    oncePerWeekProteins,
    mealTemplates,
  }
}

export function loadHousehold(): Household {
  const stored = readJson<Partial<Household> | null>(KEYS.household, null)
  return normalizeHousehold(stored)
}

export function saveHousehold(household: Household): void {
  writeJson(KEYS.household, household)
}

function normalizeWeekPlan(raw: WeekPlan | null, household: Household): WeekPlan {
  if (!raw?.weekId || !Array.isArray(raw.slots) || raw.slots.length === 0) {
    return createEmptyWeekPlan(household)
  }
  const slots = raw.slots.map((s, i) => ({
    id: s.id || `meal-${i + 1}`,
    cookId: s.cookId,
    recipeId: s.recipeId,
    locked: Boolean(s.locked),
    portions: s.portions || 2,
    coverDays: [...(s.coverDays ?? [0])],
  }))
  return { weekId: raw.weekId, slots, acceptedAt: raw.acceptedAt ?? null }
}

export function loadWeekPlan(household: Household): WeekPlan {
  const stored = readJson<WeekPlan | null>(KEYS.weekPlan, null)
  return normalizeWeekPlan(stored, household)
}

export function saveWeekPlan(plan: WeekPlan): void {
  writeJson(KEYS.weekPlan, plan)
}

export function loadHistory(): PlanHistoryEntry[] {
  return readJson(KEYS.history, [])
}

export function saveHistory(history: PlanHistoryEntry[]): void {
  writeJson(KEYS.history, history)
}

export function loadTagOverrides(): Record<string, RecipeTagOverlay> {
  return readJson(KEYS.tags, {})
}

export function saveTagOverrides(overlays: Record<string, RecipeTagOverlay>): void {
  writeJson(KEYS.tags, overlays)
}

export function loadShop(): ShopState {
  return readJson(KEYS.shop, { checked: {}, extras: [] })
}

export function saveShop(shop: ShopState): void {
  writeJson(KEYS.shop, shop)
}

export function loadPrefs(): Prefs {
  const stored = readJson<Partial<Prefs> | null>(KEYS.prefs, null)
  return { ...DEFAULT_PREFS, ...stored }
}

export function savePrefs(prefs: Prefs): void {
  writeJson(KEYS.prefs, prefs)
}

export function clearShopState(): ShopState {
  const empty = { checked: {}, extras: [] as ShopState['extras'] }
  saveShop(empty)
  return empty
}

export { newMealSlotId }
