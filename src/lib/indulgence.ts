import type { Indulgence } from '../types'

/** kcal/portion → light &lt; 500 ≤ medium ≤ 650 &lt; rich */
export const INDULGENCE_LIGHT_MAX_KCAL = 499
export const INDULGENCE_MEDIUM_MAX_KCAL = 650

export const INDULGENCE_LABELS: Record<Indulgence, string> = {
  light: 'Light',
  medium: 'Medium',
  rich: 'Rich',
}

export function indulgenceFromCalories(
  caloriesPerPortion: number | null | undefined,
): Indulgence | null {
  if (caloriesPerPortion == null || Number.isNaN(caloriesPerPortion)) {
    return null
  }
  if (caloriesPerPortion <= INDULGENCE_LIGHT_MAX_KCAL) return 'light'
  if (caloriesPerPortion <= INDULGENCE_MEDIUM_MAX_KCAL) return 'medium'
  return 'rich'
}
