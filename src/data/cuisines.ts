import type { Cuisine } from '../types'

/**
 * Flavour families for weekly balance.
 * At most one cuisine from each family on the plan (e.g. Japanese blocks Korean).
 * Exact cuisine also appears at most once (American + American never).
 * Cuisines not listed here only conflict with an exact duplicate.
 */
export const CUISINE_FLAVOUR_FAMILIES: Record<string, readonly Cuisine[]> = {
  eastAsian: ['japanese', 'korean', 'chinese', 'thai'],
  mediterranean: ['italian', 'greek', 'spanish'],
  latin: ['mexican', 'caribbean'],
}

export type CuisineFlavourFamily = keyof typeof CUISINE_FLAVOUR_FAMILIES

export function cuisineFlavourFamily(
  cuisine: Cuisine,
): CuisineFlavourFamily | null {
  for (const [family, list] of Object.entries(CUISINE_FLAVOUR_FAMILIES)) {
    if ((list as readonly string[]).includes(cuisine)) {
      return family as CuisineFlavourFamily
    }
  }
  return null
}

/** @deprecated prefer cuisineFlavourFamily — kept for call-site clarity */
export function isEastAsianCuisine(cuisine: Cuisine): boolean {
  return cuisineFlavourFamily(cuisine) === 'eastAsian'
}

export const CUISINE_LABELS: Record<Cuisine, string> = {
  mexican: 'Mexican',
  italian: 'Italian',
  american: 'American',
  british: 'British',
  japanese: 'Japanese',
  thai: 'Thai',
  korean: 'Korean',
  indian: 'Indian',
  chinese: 'Chinese',
  lithuanian: 'Lithuanian',
  caribbean: 'Caribbean',
  african: 'African',
  middleEastern: 'Middle Eastern',
  greek: 'Greek',
  spanish: 'Spanish',
  misc: 'Misc',
}

export const ALL_CUISINES: Cuisine[] = [
  'mexican',
  'italian',
  'american',
  'british',
  'japanese',
  'thai',
  'korean',
  'indian',
  'chinese',
  'lithuanian',
  'caribbean',
  'african',
  'middleEastern',
  'greek',
  'spanish',
  'misc',
]

export const FLAVOUR_FAMILY_LABELS: Record<CuisineFlavourFamily, string> = {
  eastAsian: 'Japanese / Korean / Chinese / Thai',
  mediterranean: 'Italian / Greek / Spanish',
  latin: 'Mexican / Caribbean',
}
