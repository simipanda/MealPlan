import type { Protein } from '../types'

export const PROTEIN_LABELS: Record<Protein, string> = {
  red: 'Beef',
  lamb: 'Lamb',
  white: 'Chicken',
  pork: 'Pork',
  fish: 'Seafood',
  veg: 'Vegetarian',
}

/** Beef, lamb, pork — share one “red meat” slot when limited. */
export const RED_MEAT_PROTEINS: Protein[] = ['red', 'lamb', 'pork']

export function isRedMeat(protein: Protein): boolean {
  return RED_MEAT_PROTEINS.includes(protein)
}

export const ALL_PROTEINS: Protein[] = [
  'white',
  'red',
  'pork',
  'veg',
  'fish',
  'lamb',
]

/** Solid placeholder / accent colours for thumbs and chips. */
export const PROTEIN_PLACEHOLDER: Record<Protein, string> = {
  white: '#eab308',
  red: '#7f1d1d',
  lamb: '#dc2626',
  fish: '#2563eb',
  pork: '#db2777',
  veg: '#3f6212',
}
