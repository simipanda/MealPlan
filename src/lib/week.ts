import type { DayIndex, Household, MealSlot, WeekPlan } from '../types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfWeek(date: Date, weekStartDay: DayIndex): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = (d.getDay() - weekStartDay + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

export function weekIdFor(date: Date, weekStartDay: DayIndex): string {
  return formatDate(startOfWeek(date, weekStartDay))
}

export function weekRank(day: DayIndex, weekStartDay: DayIndex): number {
  return (day - weekStartDay + 7) % 7
}

function slotSortKey(slot: MealSlot, weekStartDay: DayIndex): number {
  if (slot.coverDays.length === 0) return 99
  return Math.min(...slot.coverDays.map((d) => weekRank(d, weekStartDay)))
}

/** Meal 1 = earliest coverage in the week. */
export function orderedSlots(
  slots: MealSlot[],
  household: Household,
): MealSlot[] {
  return [...slots].sort(
    (a, b) =>
      slotSortKey(a, household.weekStartDay) -
      slotSortKey(b, household.weekStartDay),
  )
}

export function createEmptyWeekPlan(
  household: Household,
  date = new Date(),
): WeekPlan {
  const weekId = weekIdFor(date, household.weekStartDay)
  const templates =
    household.mealTemplates.length > 0
      ? household.mealTemplates
      : [
          {
            id: 'meal-1',
            cookId: 'cook1' as const,
            coverDays: [0] as DayIndex[],
            portions: 2,
          },
        ]

  const slots: MealSlot[] = templates.map((t) => ({
    id: t.id,
    cookId: t.cookId,
    recipeId: null,
    locked: false,
    portions: t.portions,
    coverDays: [...t.coverDays],
  }))

  return { weekId, slots, acceptedAt: null }
}

export function newMealSlotId(): string {
  return `meal-${crypto.randomUUID().slice(0, 8)}`
}

export function recentRecipeIds(
  history: { weekId: string; recipeIds: string[] }[],
  currentWeekId: string,
  noRepeatWeeks: number,
): Set<string> {
  const currentStart = new Date(currentWeekId + 'T12:00:00')
  const cutoff = currentStart.getTime() - noRepeatWeeks * 7 * MS_PER_DAY
  const blocked = new Set<string>()
  for (const entry of history) {
    if (entry.weekId === currentWeekId) continue
    const entryStart = new Date(entry.weekId + 'T12:00:00').getTime()
    if (entryStart >= cutoff) {
      for (const id of entry.recipeIds) blocked.add(id)
    }
  }
  return blocked
}
