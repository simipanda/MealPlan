import type { CookId, DayIndex, MealSlot } from '../types'
import { DAY_LABELS } from '../data/defaultHousehold'

/** Evenings covered ≈ portions ÷ people eating each evening. */
export function dayCountFromPortions(
  portions: number,
  peoplePerMeal: number,
): number {
  const people = Math.max(1, peoplePerMeal)
  return Math.max(1, Math.round(portions / people))
}

export function portionsFromDayCount(
  dayCount: number,
  peoplePerMeal: number,
): number {
  const people = Math.max(1, peoplePerMeal)
  return Math.max(1, Math.max(1, dayCount) * people)
}

/** Snap portions to whole evenings for the household size. */
export function snapPortions(portions: number, peoplePerMeal: number): number {
  const people = Math.max(1, peoplePerMeal)
  const days = dayCountFromPortions(portions, people)
  return portionsFromDayCount(days, people)
}

export function weekRank(day: DayIndex, weekStartDay: DayIndex): number {
  return (day - weekStartDay + 7) % 7
}

/** Cook night = earliest covered evening in the household week. */
export function cookNightFromCover(
  coverDays: DayIndex[],
  weekStartDay: DayIndex,
): DayIndex {
  if (coverDays.length === 0) return weekStartDay
  return coverDays.reduce((best, d) =>
    weekRank(d, weekStartDay) < weekRank(best, weekStartDay) ? d : best,
  )
}

/** Cover cook day, then the next evenings in calendar order. */
export function coverDaysFromCookDay(
  cookDay: DayIndex,
  dayCount: number,
): DayIndex[] {
  const n = Math.max(1, Math.min(7, dayCount))
  return Array.from({ length: n }, (_, i) => ((cookDay + i) % 7) as DayIndex)
}

/**
 * Coverage from portions: keep cook night, take that many consecutive free
 * evenings. Does not change the portion number (1 portion → 1 evening).
 * Stops before a day owned by another meal.
 */
export function coverDaysForPortions(
  cookDay: DayIndex,
  portions: number,
  peoplePerMeal: number,
  blocked: ReadonlySet<DayIndex> = new Set(),
): DayIndex[] {
  const want = dayCountFromPortions(portions, peoplePerMeal)
  const days: DayIndex[] = []
  for (let i = 0; i < 7 && days.length < want; i++) {
    const day = ((cookDay + i) % 7) as DayIndex
    if (blocked.has(day)) {
      if (days.length === 0) continue
      break
    }
    days.push(day)
  }
  return days.length > 0 ? days : [cookDay]
}

export function syncSlotFromPortions(
  cookDay: DayIndex,
  portions: number,
  peoplePerMeal: number,
  blocked: ReadonlySet<DayIndex> = new Set(),
): { portions: number; coverDays: DayIndex[] } {
  const nextPortions = Math.max(1, portions)
  return {
    portions: nextPortions,
    coverDays: coverDaysForPortions(
      cookDay,
      nextPortions,
      peoplePerMeal,
      blocked,
    ),
  }
}

export function syncSlotFromCoverDays(
  coverDays: DayIndex[],
  peoplePerMeal: number,
): { portions: number; coverDays: DayIndex[] } {
  const next =
    coverDays.length > 0
      ? ([...coverDays].sort((a, b) => a - b) as DayIndex[])
      : ([0] as DayIndex[])
  return {
    coverDays: next,
    portions: portionsFromDayCount(next.length, peoplePerMeal),
  }
}

/** Who already covers this day (another cook’s slot)? */
export function coverConflictCookId(
  slots: MealSlot[],
  cookId: CookId,
  day: DayIndex,
): CookId | null {
  for (const slot of slots) {
    if (slot.cookId === cookId) continue
    if (slot.coverDays.includes(day)) return slot.cookId
  }
  return null
}

/** All days claimed by any slot (for UI). */
export function dayOwners(
  slots: MealSlot[],
): Partial<Record<DayIndex, CookId>> {
  const owners: Partial<Record<DayIndex, CookId>> = {}
  for (const slot of slots) {
    for (const day of slot.coverDays) {
      owners[day] = slot.cookId
    }
  }
  return owners
}

export function overlapWarning(
  slots: MealSlot[],
  nameOf: (id: CookId) => string,
): string | null {
  const seen = new Map<DayIndex, CookId>()
  for (const slot of slots) {
    for (const day of slot.coverDays) {
      const prior = seen.get(day)
      if (prior && prior !== slot.cookId) {
        return `${DAY_LABELS[day]} is covered by both ${nameOf(prior)} and ${nameOf(slot.cookId)}. Each evening can only belong to one meal.`
      }
      seen.set(day, slot.cookId)
    }
  }
  return null
}
