import { describe, expect, it } from 'vitest'
import { formatAmountLine, formatIngredientAmount, scaleQty } from './units'

describe('scaleQty', () => {
  it('scales 4-portion recipe to 6 portions', () => {
    expect(scaleQty(200, 4, 6)).toBe(300)
  })

  it('leaves null qty alone', () => {
    expect(scaleQty(null, 4, 6)).toBeNull()
  })
})

describe('formatIngredientAmount', () => {
  it('shows metric primary with US oz in brackets for grams', () => {
    const formatted = formatIngredientAmount(
      { name: 'beef', qty: 500, unit: 'g' },
      4,
      4,
      'metric',
    )
    expect(formatted.primary).toBe('500g')
    expect(formatted.secondary).toMatch(/oz/)
    expect(formatAmountLine(formatted)).toMatch(/500g \(.+oz\)/)
  })

  it('shows US cups primary with ml in brackets for liquids', () => {
    const formatted = formatIngredientAmount(
      { name: 'stock', qty: 240, unit: 'ml' },
      2,
      2,
      'us',
    )
    expect(formatted.primary).toMatch(/cup/)
    expect(formatted.secondary).toBe('240ml')
  })

  it('keeps to-taste without conversion', () => {
    const formatted = formatIngredientAmount(
      { name: 'salt', qty: null, unit: 'toTaste' },
      4,
      6,
      'us',
    )
    expect(formatted.primary).toBe('to taste')
    expect(formatted.secondary).toBeNull()
  })
})
