import { describe, expect, it } from 'vitest'
import type { MealSlot } from '../types'
import {
  coverConflictCookId,
  coverDaysForPortions,
  coverDaysFromCookDay,
  overlapWarning,
  syncSlotFromCoverDays,
  syncSlotFromPortions,
} from './coverage'

describe('coverage helpers', () => {
  it('builds consecutive cover days from cook day', () => {
    expect(coverDaysFromCookDay(0, 3)).toEqual([0, 1, 2])
    expect(coverDaysFromCookDay(5, 3)).toEqual([5, 6, 0])
  })

  it('maps 6 portions / 2 people → 3 evenings from cook day', () => {
    expect(syncSlotFromPortions(0, 6, 2)).toEqual({
      portions: 6,
      coverDays: [0, 1, 2],
    })
  })

  it('maps 1 portion → cook night only (no leftover reheats)', () => {
    expect(syncSlotFromPortions(0, 1, 2)).toEqual({
      portions: 1,
      coverDays: [0],
    })
    expect(coverDaysForPortions(0, 1, 2)).toEqual([0])
  })

  it('stops coverage before a day owned by another meal', () => {
    expect(coverDaysForPortions(0, 6, 2, new Set([1]))).toEqual([0])
  })

  it('maps cover days back to portions via people per evening', () => {
    expect(syncSlotFromCoverDays([0, 1], 2).portions).toBe(4)
  })
})

describe('coverage conflicts', () => {
  const slots: MealSlot[] = [
    {
      id: 'meal-1',
      cookId: 'cook1',
      recipeId: 'a',
      locked: false,
      portions: 2,
      coverDays: [0, 1],
    },
    {
      id: 'meal-2',
      cookId: 'cook2',
      recipeId: 'b',
      locked: false,
      portions: 2,
      coverDays: [3, 4],
    },
  ]

  it('detects when another cook already owns a day', () => {
    expect(coverConflictCookId(slots, 'cook2', 0)).toBe('cook1')
    expect(coverConflictCookId(slots, 'cook2', 3)).toBeNull()
  })

  it('reports overlapping coverage', () => {
    const overlapping: MealSlot[] = [
      { ...slots[0]!, coverDays: [0, 3] },
      { ...slots[1]!, coverDays: [3, 4] },
    ]
    expect(
      overlapWarning(overlapping, (id) => (id === 'cook1' ? 'Sim' : 'Adam')),
    ).toMatch(/Wed/)
  })
})
