import type { CookTimeBand } from '../types'

export const COOK_TIME_BANDS: CookTimeBand[] = ['easy', 'medium', 'hard']

export const COOK_TIME_LABELS: Record<CookTimeBand, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

/** Easy ≤30, Medium 31–60, Hard 61+. */
export function cookTimeBand(totalMinutes: number): CookTimeBand {
  if (totalMinutes <= 30) return 'easy'
  if (totalMinutes <= 60) return 'medium'
  return 'hard'
}

export function formatCookTime(totalMinutes: number): string {
  return `${totalMinutes} min`
}
