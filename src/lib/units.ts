import type { Ingredient, IngredientUnit, UnitSystem } from '../types'

export interface FormattedAmount {
  primary: string
  secondary: string | null
}

const US_CUP_ML = 240
const OZ_G = 28.3495

function roundNice(n: number): number {
  if (n >= 100) return Math.round(n)
  if (n >= 10) return Math.round(n * 10) / 10
  return Math.round(n * 100) / 100
}

function formatNumber(n: number): string {
  const r = roundNice(n)
  if (Number.isInteger(r)) return String(r)
  return String(r)
}

function toUsCups(ml: number): string {
  const cups = ml / US_CUP_ML
  if (cups >= 0.9) return `${formatNumber(cups)} cup${cups >= 1.05 ? 's' : ''}`
  const tbsp = ml / 15
  if (tbsp >= 0.9) return `${formatNumber(tbsp)} tbsp`
  const tsp = ml / 5
  return `${formatNumber(tsp)} tsp`
}

function metricLabel(qty: number, unit: IngredientUnit): string {
  switch (unit) {
    case 'g':
      return `${formatNumber(qty)}g`
    case 'ml':
      return `${formatNumber(qty)}ml`
    case 'tsp':
      return `${formatNumber(qty)} tsp`
    case 'tbsp':
      return `${formatNumber(qty)} tbsp`
    case 'each':
      return qty === 1 ? '1' : formatNumber(qty)
    case 'tin':
      return `${formatNumber(qty)} tin${qty === 1 ? '' : 's'}`
    case 'clove':
      return `${formatNumber(qty)} clove${qty === 1 ? '' : 's'}`
    case 'pinch':
      return 'pinch'
    case 'toTaste':
      return 'to taste'
  }
}

function usLabel(qty: number, unit: IngredientUnit): string | null {
  switch (unit) {
    case 'g':
      return `${formatNumber(qty / OZ_G)} oz`
    case 'ml':
      return toUsCups(qty)
    case 'tsp':
    case 'tbsp':
    case 'each':
    case 'tin':
    case 'clove':
    case 'pinch':
    case 'toTaste':
      return null
  }
}

/** Scale a canonical metric ingredient qty by portions / basePortions. */
export function scaleQty(
  qty: number | null,
  basePortions: number,
  targetPortions: number,
): number | null {
  if (qty === null) return null
  if (basePortions <= 0) return qty
  return (qty * targetPortions) / basePortions
}

export function formatIngredientAmount(
  ingredient: Ingredient,
  basePortions: number,
  targetPortions: number,
  unitSystem: UnitSystem,
): FormattedAmount {
  const scaled = scaleQty(ingredient.qty, basePortions, targetPortions)
  if (scaled === null || ingredient.unit === 'toTaste' || ingredient.unit === 'pinch') {
    const label = ingredient.unit === 'pinch' ? 'pinch' : 'to taste'
    return { primary: label, secondary: null }
  }

  const metric = metricLabel(scaled, ingredient.unit)
  const us = usLabel(scaled, ingredient.unit)

  if (unitSystem === 'metric') {
    return { primary: metric, secondary: us }
  }

  if (us) {
    return { primary: us, secondary: metric }
  }
  return { primary: metric, secondary: null }
}

export function formatAmountLine(formatted: FormattedAmount): string {
  if (formatted.secondary) {
    return `${formatted.primary} (${formatted.secondary})`
  }
  return formatted.primary
}
