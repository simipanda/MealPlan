import { describe, expect, it } from 'vitest'
import type { EffectiveRecipe, MealSlot, Protein } from '../types'
import {
  candidatePool,
  manualPickStatus,
  pickRandomRecipe,
  randomiseUnlockedSlots,
  redMeatConflictWarning,
} from './randomise'

const DEFAULT_ONCE: Protein[] = ['red', 'lamb', 'pork']

const recipes: EffectiveRecipe[] = [
  {
    id: 'beef-stew',
    title: 'Beef Stew',
    basePortions: 4,
    totalMinutes: 120,
    cuisine: 'british',
    method: [],
    cookTag: 'cook1',
    protein: 'red',
    baseProtein: 'red',
    rating: null,
    indulgence: 'light',
    kidFriendly: false,
    ingredients: [],
  },
  {
    id: 'chicken-tray',
    title: 'Chicken Traybake',
    basePortions: 4,
    totalMinutes: 55,
    cuisine: 'british',
    method: [],
    cookTag: 'cook2',
    protein: 'white',
    baseProtein: 'white',
    rating: null,
    indulgence: 'light',
    kidFriendly: true,
    ingredients: [],
  },
  {
    id: 'cheesy-pasta',
    title: 'Cheesy Pasta',
    basePortions: 4,
    totalMinutes: 40,
    cuisine: 'american',
    method: [],
    cookTag: 'either',
    protein: 'veg',
    baseProtein: 'veg',
    rating: null,
    indulgence: 'rich',
    kidFriendly: true,
    ingredients: [],
  },
  {
    id: 'salmon',
    title: 'Salmon',
    basePortions: 4,
    totalMinutes: 25,
    cuisine: 'japanese',
    method: [],
    cookTag: 'cook2',
    protein: 'fish',
    baseProtein: 'fish',
    rating: null,
    indulgence: 'light',
    kidFriendly: false,
    ingredients: [],
  },
  {
    id: 'lamb',
    title: 'Lamb Curry',
    basePortions: 4,
    totalMinutes: 90,
    cuisine: 'indian',
    method: [],
    cookTag: 'cook2',
    protein: 'lamb',
    baseProtein: 'lamb',
    rating: null,
    indulgence: 'light',
    kidFriendly: false,
    ingredients: [],
  },
]

function slots(partial: Partial<MealSlot>[] = []): MealSlot[] {
  return [
    {
      id: 'meal-1',
      cookId: 'cook1',
      recipeId: null,
      locked: false,
      portions: 6,
      coverDays: [0, 1, 2],
      ...partial[0],
    },
    {
      id: 'meal-2',
      cookId: 'cook2',
      recipeId: null,
      locked: false,
      portions: 4,
      coverDays: [3, 4],
      ...partial[1],
    },
  ]
}

function input(
  slotIndex: number,
  slotPartial: Partial<MealSlot>[] = [],
  blocked: Set<string> = new Set(),
  once: Protein[] = DEFAULT_ONCE,
) {
  return {
    recipes,
    slots: slots(slotPartial),
    slotIndex,
    blockedRecipeIds: blocked,
    oncePerWeekProteins: once,
  }
}

describe('candidatePool', () => {
  it('only offers cook-matching recipes', () => {
    const pool = candidatePool(input(0))
    expect(pool.map((r) => r.id).sort()).toEqual(['beef-stew', 'cheesy-pasta'])
  })

  it('excludes the same once-per-week protein already used', () => {
    const withExtraBeef: EffectiveRecipe[] = [
      ...recipes,
      {
        id: 'beef-2',
        title: 'More Beef',
        basePortions: 4,
        totalMinutes: 60,
        cuisine: 'british',
        method: [],
        cookTag: 'cook2',
        protein: 'red',
    baseProtein: 'red',
    rating: null,
        indulgence: 'light',
        kidFriendly: false,
        ingredients: [],
      },
    ]
    const pool = candidatePool({
      ...input(1, [{ recipeId: 'beef-stew', locked: true }, {}]),
      recipes: withExtraBeef,
    })
    expect(pool.map((r) => r.id)).not.toContain('beef-2')
    // other red meats (lamb/pork) are separate once-per-week slots
    expect(pool.map((r) => r.id)).toContain('lamb')
    expect(pool.map((r) => r.id)).toContain('chicken-tray')
  })

  it('allows beef when pork is locked (different meat types)', () => {
    const withPork: EffectiveRecipe[] = [
      ...recipes,
      {
        id: 'pork-chop',
        title: 'Pork Chop',
        basePortions: 4,
        totalMinutes: 40,
        cuisine: 'british',
        method: [],
        cookTag: 'cook1',
        protein: 'pork',
    baseProtein: 'pork',
    rating: null,
        indulgence: 'light',
        kidFriendly: false,
        ingredients: [],
      },
    ]
    const pool = candidatePool({
      recipes: withPork,
      slots: [
        {
          id: 'meal-1',
          cookId: 'cook1',
          recipeId: 'pork-chop',
          locked: true,
          portions: 4,
          coverDays: [0, 1],
        },
        {
          id: 'meal-2',
          cookId: 'cook2',
          recipeId: null,
          locked: false,
          portions: 4,
          coverDays: [3, 4],
        },
      ],
      slotIndex: 1,
      blockedRecipeIds: new Set(),
      oncePerWeekProteins: DEFAULT_ONCE,
    })
    // beef-stew is cook1-tagged so not in cook2’s pool; lamb is the red-meat check
    expect(pool.map((r) => r.id)).toContain('lamb')
    expect(pool.map((r) => r.id)).toContain('chicken-tray')
    expect(pool.map((r) => r.id)).not.toContain('pork-chop')
  })

  it('allows repeating limited proteins when once-per-week list is empty', () => {
    const withExtraBeef: EffectiveRecipe[] = [
      ...recipes,
      {
        id: 'beef-2',
        title: 'More Beef',
        basePortions: 4,
        totalMinutes: 60,
        cuisine: 'british',
        method: [],
        cookTag: 'cook2',
        protein: 'red',
    baseProtein: 'red',
    rating: null,
        indulgence: 'light',
        kidFriendly: false,
        ingredients: [],
      },
    ]
    const pool = candidatePool({
      ...input(1, [{ recipeId: 'beef-stew', locked: true }, {}], new Set(), []),
      recipes: withExtraBeef,
    })
    expect(pool.map((r) => r.id)).toContain('beef-2')
  })

  it('excludes rich when another slot is rich', () => {
    const pool = candidatePool(
      input(1, [{ recipeId: 'cheesy-pasta', locked: true }, {}]),
    )
    expect(pool.every((r) => r.indulgence !== 'rich')).toBe(true)
  })

  it('excludes recipes in the no-repeat history set', () => {
    const pool = candidatePool(input(0, [], new Set(['beef-stew'])))
    expect(pool.map((r) => r.id)).not.toContain('beef-stew')
  })
})

describe('pickRandomRecipe', () => {
  it('returns empty_pool when nothing matches', () => {
    const result = pickRandomRecipe(
      input(
        1,
        [{ recipeId: 'beef-stew', locked: true }, {}],
        new Set(['chicken-tray', 'salmon', 'lamb', 'cheesy-pasta']),
      ),
    )
    expect(result.ok).toBe(false)
  })
})

describe('randomiseUnlockedSlots', () => {
  it('leaves locked slots unchanged', () => {
    const { slots: next } = randomiseUnlockedSlots(
      recipes,
      slots([{ recipeId: 'beef-stew', locked: true }, {}]),
      new Set(),
      DEFAULT_ONCE,
      () => 0,
    )
    expect(next[0]?.recipeId).toBe('beef-stew')
    expect(next[0]?.locked).toBe(true)
    expect(next[1]?.recipeId).toBeTruthy()
  })
})

describe('manualPickStatus', () => {
  it('blocks a recipe already assigned to the other meal without override', () => {
    const cheesy = recipes.find((r) => r.id === 'cheesy-pasta')!
    const status = manualPickStatus(
      cheesy,
      input(1, [{ recipeId: 'cheesy-pasta', locked: true }, {}]),
    )
    expect(status.ok).toBe(false)
    if (!status.ok) {
      expect(status.reason).toMatch(/Already on this week/)
      expect(status.kind).toBe('already_planned')
      expect(status.allowCookOverride).toBeUndefined()
    }
  })

  it('does not offer override when wrong-cook AND already planned', () => {
    const beef = recipes.find((r) => r.id === 'beef-stew')!
    const status = manualPickStatus(
      beef,
      input(1, [{ recipeId: 'beef-stew', locked: true }, {}]),
    )
    expect(status.ok).toBe(false)
    if (!status.ok) {
      expect(status.kind).toBe('already_planned')
      expect(status.allowCookOverride).toBeFalsy()
    }
  })

  it('allows eligible recipes for the assigning cook', () => {
    const chicken = recipes.find((r) => r.id === 'chicken-tray')!
    const status = manualPickStatus(
      chicken,
      input(1, [{ recipeId: 'beef-stew', locked: true }, {}]),
    )
    expect(status).toEqual({ ok: true })
  })

  it('marks wrong-cook as overridable, and override unlocks if other rules pass', () => {
    const chicken = recipes.find((r) => r.id === 'chicken-tray')!
    const blocked = manualPickStatus(chicken, input(0))
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.allowCookOverride).toBe(true)

    const forced = manualPickStatus(chicken, input(0), {
      overrideCookTag: true,
    })
    expect(forced).toEqual({ ok: true })
  })

  it('allows lamb when beef is already planned (separate once-per-week types)', () => {
    const lamb = recipes.find((r) => r.id === 'lamb')!
    const status = manualPickStatus(
      lamb,
      input(1, [{ recipeId: 'beef-stew', locked: true }, {}]),
    )
    expect(status).toEqual({ ok: true })
  })
})

describe('redMeatConflictWarning', () => {
  it('warns when two red meats are on the plan (soft only)', () => {
    const withPork: EffectiveRecipe[] = [
      ...recipes,
      {
        id: 'pork-chop',
        title: 'Pork Chop',
        basePortions: 4,
        totalMinutes: 40,
        cuisine: 'british',
        method: [],
        cookTag: 'cook1',
        protein: 'pork',
    baseProtein: 'pork',
    rating: null,
        indulgence: 'light',
        kidFriendly: false,
        ingredients: [],
      },
    ]
    const warning = redMeatConflictWarning(
      [
        {
          id: 'meal-1',
          cookId: 'cook1',
          recipeId: 'pork-chop',
          locked: true,
          portions: 4,
          coverDays: [0],
        },
        {
          id: 'meal-2',
          cookId: 'cook2',
          recipeId: 'beef-stew',
          locked: true,
          portions: 4,
          coverDays: [3],
        },
      ],
      withPork,
      DEFAULT_ONCE,
    )
    expect(warning).toMatch(/More than one red meat/)
    expect(warning).toMatch(/Pork/)
    expect(warning).toMatch(/Beef/)
    expect(warning).toMatch(/Fine if you meant/)
  })

  it('is silent with a single red meat', () => {
    expect(
      redMeatConflictWarning(
        slots([{ recipeId: 'beef-stew', locked: true }, {}]),
        recipes,
        DEFAULT_ONCE,
      ),
    ).toBeNull()
  })
})

