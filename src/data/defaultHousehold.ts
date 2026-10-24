import type { Household, Prefs } from '../types'

/** Sim & Adam starter template — fully editable in Settings. */
export const DEFAULT_HOUSEHOLD: Household = {
  cooks: [
    { id: 'cook1', name: 'Sim' },
    { id: 'cook2', name: 'Adam' },
  ],
  weekStartDay: 0,
  noRepeatWeeks: 6,
  peoplePerMeal: 2,
  oncePerWeekProteins: ['red', 'lamb', 'pork'],
  mealTemplates: [
    {
      id: 'meal-sim',
      cookId: 'cook1',
      coverDays: [0, 1, 2],
      portions: 6,
    },
    {
      id: 'meal-adam',
      cookId: 'cook2',
      coverDays: [3, 4],
      portions: 4,
    },
  ],
}

export const DEFAULT_PREFS: Prefs = {
  unitSystem: 'metric',
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const DAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const
