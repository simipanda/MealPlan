import { PROTEIN_LABELS } from '../data/proteinIcons'
import type { Ingredient, Protein, Recipe } from '../types'

/** Noun used when rewriting mince/meat lines for a protein choice. */
export function meatNounFor(
  recipe: Recipe,
  protein: Protein,
): string {
  const custom = recipe.proteinOptionLabels?.[protein]?.trim()
  if (custom) {
    // "Turkey mince" / "Pork" → turkey / pork
    return custom
      .replace(/\b(mince|ground)\b/gi, '')
      .trim()
      .toLowerCase() || custom.toLowerCase()
  }
  const fallback: Record<Protein, string> = {
    pork: 'pork',
    white: 'chicken',
    red: 'beef',
    lamb: 'lamb',
    fish: 'fish',
    veg: 'veg',
  }
  return fallback[protein]
}

export function proteinChoiceLabel(
  recipe: Pick<Recipe, 'proteinOptionLabels'>,
  protein: Protein,
): string {
  return recipe.proteinOptionLabels?.[protein] ?? PROTEIN_LABELS[protein]
}

/** Allowed swaps for this recipe (default protein alone if none listed). */
export function proteinChoices(recipe: Recipe): Protein[] {
  const opts = recipe.proteinOptions
  if (!opts?.length) return [recipe.protein]
  const set = new Set<Protein>([recipe.protein, ...opts])
  return [...set]
}

/**
 * Keep grams the same; rewrite mince/meat names toward the active protein.
 * Leaves bacon and non-meat lines alone.
 */
export function ingredientsForProtein(
  ingredients: Ingredient[],
  recipe: Recipe,
  activeProtein: Protein,
): Ingredient[] {
  if (activeProtein === recipe.protein && !recipe.proteinOptions?.length) {
    return ingredients
  }
  const noun = meatNounFor(recipe, activeProtein)
  return ingredients.map((ing) => ({
    ...ing,
    name: rewriteMeatName(ing.name, noun),
  }))
}

export function rewriteMeatName(name: string, targetNoun: string): string {
  // Skip bacon — stays pork even when mince swaps to turkey/chicken
  if (/\bbacon\b/i.test(name) && !/\b(beef|pork|turkey|chicken|lamb)\s+mince\b/i.test(name)) {
    return name
  }

  let next = name
  next = next.replace(
    /\b(lean\s+)?(ground)\s+(beef|pork|turkey|chicken|lamb)(\s+or\s+(beef|pork|turkey|chicken|lamb))?\b/gi,
    (_m, lean: string | undefined, ground: string) =>
      `${lean ?? ''}${ground} ${targetNoun}`,
  )
  next = next.replace(
    /\b(beef|pork|turkey|chicken|lamb)\s+(mince)\b/gi,
    (_m, _meat: string, mince: string) => `${targetNoun} ${mince}`,
  )
  return next.replace(/\s+/g, ' ').trim()
}
