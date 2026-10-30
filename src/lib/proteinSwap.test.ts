import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types'
import {
  ingredientsForProtein,
  proteinChoices,
  rewriteMeatName,
} from './proteinSwap'

const ramenBase: Recipe = {
  id: 'easiest-ramen',
  title: 'Easiest ramen',
  basePortions: 2,
  totalMinutes: 40,
  cookTag: 'either',
  protein: 'pork',
  proteinOptions: ['pork', 'white'],
  proteinOptionLabels: { pork: 'Pork', white: 'Chicken' },
  cuisine: 'japanese',
  indulgence: 'light',
  kidFriendly: false,
  method: [],
  ingredients: [
    { name: 'Ground pork', qty: 150, unit: 'g' },
    { name: 'Ramen noodles', qty: 113, unit: 'g' },
  ],
}

describe('rewriteMeatName', () => {
  it('swaps ground pork to chicken', () => {
    expect(rewriteMeatName('Ground pork', 'chicken')).toBe('Ground chicken')
  })

  it('swaps lean ground beef or turkey to turkey', () => {
    expect(rewriteMeatName('Lean ground beef or turkey', 'turkey')).toBe(
      'Lean ground turkey',
    )
  })

  it('leaves bacon alone', () => {
    expect(rewriteMeatName('Thick center cut bacon', 'turkey')).toBe(
      'Thick center cut bacon',
    )
  })
})

describe('ingredientsForProtein', () => {
  it('keeps grams and renames meat when swapping', () => {
    const next = ingredientsForProtein(ramenBase.ingredients, ramenBase, 'white')
    expect(next[0]).toEqual({ name: 'Ground chicken', qty: 150, unit: 'g' })
    expect(next[1].name).toBe('Ramen noodles')
  })
})

describe('proteinChoices', () => {
  it('includes default and options', () => {
    expect(proteinChoices(ramenBase)).toEqual(['pork', 'white'])
  })
})
