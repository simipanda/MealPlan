import { describe, expect, it } from 'vitest'
import { cookTimeBand, formatCookTime } from './cookTime'

describe('cookTimeBand', () => {
  it('maps Easy ≤30, Medium 31–60, Hard 61+', () => {
    expect(cookTimeBand(15)).toBe('easy')
    expect(cookTimeBand(30)).toBe('easy')
    expect(cookTimeBand(31)).toBe('medium')
    expect(cookTimeBand(50)).toBe('medium')
    expect(cookTimeBand(60)).toBe('medium')
    expect(cookTimeBand(61)).toBe('hard')
    expect(cookTimeBand(150)).toBe('hard')
  })
})

describe('formatCookTime', () => {
  it('shows minutes', () => {
    expect(formatCookTime(45)).toBe('45 min')
  })
})
