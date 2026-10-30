import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_HOUSEHOLD } from '../data/defaultHousehold'
import { isSauceRecipe, mergeAllRecipes, loadRecipes } from '../lib/recipes'
import { manualPickStatus, randomiseUnlockedSlots } from '../lib/randomise'
import {
  clearShopState,
  loadHistory,
  loadHousehold,
  loadPrefs,
  loadShop,
  loadTagOverrides,
  loadWeekPlan,
  saveHistory,
  saveHousehold,
  savePrefs,
  saveShop,
  saveTagOverrides,
  saveWeekPlan,
} from '../lib/storage'
import {
  createEmptyWeekPlan,
  newMealSlotId,
  recentRecipeIds,
  weekIdFor,
} from '../lib/week'
import type {
  CookId,
  DayIndex,
  EffectiveRecipe,
  Household,
  MealSlot,
  PlanHistoryEntry,
  Prefs,
  Recipe,
  RecipeTagOverlay,
  ShopExtra,
  ShopState,
  UnitSystem,
  WeekPlan,
} from '../types'
import { DEFAULT_PREFS } from '../data/defaultHousehold'

interface AppContextValue {
  ready: boolean
  error: string | null
  recipes: EffectiveRecipe[]
  rawRecipes: Recipe[]
  household: Household
  setHousehold: (h: Household) => void
  weekPlan: WeekPlan
  setWeekPlan: (p: WeekPlan) => void
  prefs: Prefs
  setUnitSystem: (u: UnitSystem) => void
  shop: ShopState
  toggleChecked: (key: string) => void
  addExtra: (label: string) => void
  removeExtra: (id: string) => void
  addSauceToShop: (recipeId: string, portions?: number) => void
  removeSauceFromShop: (recipeId: string) => void
  clearShop: () => void
  tagOverrides: Record<string, RecipeTagOverlay>
  updateTags: (recipeId: string, overlay: RecipeTagOverlay) => void
  history: PlanHistoryEntry[]
  randomise: () => {
    errors: { slotId: string; cookId: CookId; reason: string }[]
  }
  setSlot: (slotId: string, patch: Partial<MealSlot>) => void
  assignRecipe: (
    slotId: string,
    recipeId: string,
    options?: { lock?: boolean; overrideCookTag?: boolean },
  ) => void
  addMealThisWeek: (cookId?: CookId) => void
  removeMealThisWeek: (slotId: string) => void
  ensureCurrentWeek: () => void
  startNextWeek: () => void
  getRecipe: (id: string | null) => EffectiveRecipe | undefined
  cookName: (id: CookId) => string
}

const AppContext = createContext<AppContextValue | null>(null)

function pushHistory(
  history: PlanHistoryEntry[],
  plan: WeekPlan,
): PlanHistoryEntry[] {
  const recipeIds = plan.slots
    .map((s) => s.recipeId)
    .filter((id): id is string => Boolean(id))
  if (recipeIds.length === 0) return history
  const without = history.filter((h) => h.weekId !== plan.weekId)
  return [{ weekId: plan.weekId, recipeIds }, ...without].slice(0, 52)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawRecipes, setRawRecipes] = useState<Recipe[]>([])
  const [household, setHouseholdState] = useState<Household>(DEFAULT_HOUSEHOLD)
  const [weekPlan, setWeekPlanState] = useState<WeekPlan>(() =>
    createEmptyWeekPlan(DEFAULT_HOUSEHOLD),
  )
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS)
  const [shop, setShopState] = useState<ShopState>({
    checked: {},
    extras: [],
    sauces: [],
  })
  const [tagOverrides, setTagOverridesState] = useState<
    Record<string, RecipeTagOverlay>
  >({})
  const [history, setHistoryState] = useState<PlanHistoryEntry[]>([])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const hh = loadHousehold()
        const plan = loadWeekPlan(hh)
        const currentId = weekIdFor(new Date(), hh.weekStartDay)
        let hist = loadHistory()
        let resolvedPlan = plan
        if (plan.weekId !== currentId) {
          if (plan.slots.some((s) => s.recipeId)) {
            hist = pushHistory(hist, plan)
            saveHistory(hist)
          }
          resolvedPlan = createEmptyWeekPlan(hh)
          saveWeekPlan(resolvedPlan)
        }

        const base = import.meta.env.BASE_URL
        const loaded = await loadRecipes(base)
        if (cancelled) return

        setRawRecipes(loaded)
        setHouseholdState(hh)
        setWeekPlanState(resolvedPlan)
        setPrefsState(loadPrefs())
        setShopState(loadShop())
        setTagOverridesState(loadTagOverrides())
        setHistoryState(hist)
        setReady(true)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to start app')
          setReady(true)
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const recipes = useMemo(
    () => mergeAllRecipes(rawRecipes, tagOverrides),
    [rawRecipes, tagOverrides],
  )

  const setHousehold = useCallback((h: Household) => {
    setHouseholdState(h)
    saveHousehold(h)
  }, [])

  const setWeekPlan = useCallback((p: WeekPlan) => {
    setWeekPlanState(p)
    saveWeekPlan(p)
  }, [])

  const setUnitSystem = useCallback((unitSystem: UnitSystem) => {
    setPrefsState((prev) => {
      const next = { ...prev, unitSystem }
      savePrefs(next)
      return next
    })
  }, [])


  const toggleChecked = useCallback((key: string) => {
    setShopState((prev) => {
      const next = {
        ...prev,
        checked: { ...prev.checked, [key]: !prev.checked[key] },
      }
      saveShop(next)
      return next
    })
  }, [])

  const addExtra = useCallback((label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return
    setShopState((prev) => {
      const extra: ShopExtra = {
        id: crypto.randomUUID(),
        label: trimmed,
      }
      const next = { ...prev, extras: [...prev.extras, extra] }
      saveShop(next)
      return next
    })
  }, [])

  const removeExtra = useCallback((id: string) => {
    setShopState((prev) => {
      const next = {
        ...prev,
        extras: prev.extras.filter((e) => e.id !== id),
      }
      saveShop(next)
      return next
    })
  }, [])

  const addSauceToShop = useCallback(
    (recipeId: string, portions?: number) => {
      const recipe = recipes.find((r) => r.id === recipeId)
      if (!recipe || !isSauceRecipe(recipe)) return
      const qty = portions ?? recipe.basePortions
      setShopState((prev) => {
        const without = (prev.sauces ?? []).filter((s) => s.recipeId !== recipeId)
        const next = {
          ...prev,
          sauces: [...without, { recipeId, portions: qty }],
        }
        saveShop(next)
        return next
      })
    },
    [recipes],
  )

  const removeSauceFromShop = useCallback((recipeId: string) => {
    setShopState((prev) => {
      const next = {
        ...prev,
        sauces: (prev.sauces ?? []).filter((s) => s.recipeId !== recipeId),
      }
      saveShop(next)
      return next
    })
  }, [])

  const clearShop = useCallback(() => {
    const empty = clearShopState()
    setShopState(empty)
  }, [])

  const updateTags = useCallback((recipeId: string, overlay: RecipeTagOverlay) => {
    setTagOverridesState((prev) => {
      const next = { ...prev, [recipeId]: { ...prev[recipeId], ...overlay } }
      saveTagOverrides(next)
      return next
    })
  }, [])

  const setSlot = useCallback((slotId: string, patch: Partial<MealSlot>) => {
    setWeekPlanState((prev) => {
      const slots = prev.slots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              ...patch,
              id: s.id,
              coverDays: patch.coverDays
                ? ([...patch.coverDays] as DayIndex[])
                : s.coverDays,
            }
          : s,
      )
      const next = { ...prev, slots }
      saveWeekPlan(next)
      return next
    })
  }, [])

  const assignRecipe = useCallback(
    (
      slotId: string,
      recipeId: string,
      options: { lock?: boolean; overrideCookTag?: boolean } = {},
    ) => {
      const lock = options.lock ?? true
      const slotIndex = weekPlan.slots.findIndex((s) => s.id === slotId)
      const recipe = recipes.find((r) => r.id === recipeId)
      if (slotIndex < 0 || !recipe) return
      const blocked = recentRecipeIds(
        history,
        weekPlan.weekId,
        household.noRepeatWeeks,
      )
      const status = manualPickStatus(
        recipe,
        {
          recipes,
          slots: weekPlan.slots,
          slotIndex,
          blockedRecipeIds: blocked,
          oncePerWeekProteins: household.oncePerWeekProteins,
        },
        { overrideCookTag: options.overrideCookTag },
      )
      if (!status.ok) return
      setSlot(slotId, { recipeId, locked: lock })
    },
    [
      setSlot,
      weekPlan.slots,
      weekPlan.weekId,
      recipes,
      history,
      household.noRepeatWeeks,
      household.oncePerWeekProteins,
    ],
  )

  const addMealThisWeek = useCallback(
    (cookId: CookId = 'cook1') => {
      setWeekPlanState((prev) => {
        const slot: MealSlot = {
          id: newMealSlotId(),
          cookId,
          recipeId: null,
          locked: false,
          portions: household.peoplePerMeal,
          coverDays: [],
        }
        // default cover: first free evening in the week
        const taken = new Set(prev.slots.flatMap((s) => s.coverDays))
        for (let i = 0; i < 7; i++) {
          const day = ((household.weekStartDay + i) % 7) as DayIndex
          if (!taken.has(day)) {
            slot.coverDays = [day]
            break
          }
        }
        if (slot.coverDays.length === 0) slot.coverDays = [household.weekStartDay]
        const next = { ...prev, slots: [...prev.slots, slot] }
        saveWeekPlan(next)
        return next
      })
    },
    [household.peoplePerMeal, household.weekStartDay],
  )

  const removeMealThisWeek = useCallback((slotId: string) => {
    setWeekPlanState((prev) => {
      if (prev.slots.length <= 1) return prev
      const next = {
        ...prev,
        slots: prev.slots.filter((s) => s.id !== slotId),
      }
      saveWeekPlan(next)
      return next
    })
  }, [])



  const ensureCurrentWeek = useCallback(() => {
    const currentId = weekIdFor(new Date(), household.weekStartDay)
    if (weekPlan.weekId !== currentId) {
      if (weekPlan.slots.some((s) => s.recipeId)) {
        const nextHistory = pushHistory(history, weekPlan)
        setHistoryState(nextHistory)
        saveHistory(nextHistory)
      }
      const fresh = createEmptyWeekPlan(household)
      setWeekPlan(fresh)
    }
  }, [household, weekPlan, history, setWeekPlan])

  const startNextWeek = useCallback(() => {
    if (weekPlan.slots.some((s) => s.recipeId)) {
      const nextHistory = pushHistory(history, weekPlan)
      setHistoryState(nextHistory)
      saveHistory(nextHistory)
    }
    clearShop()
    const fresh = createEmptyWeekPlan(household)
    setWeekPlan(fresh)
  }, [weekPlan, history, household, clearShop, setWeekPlan])

  const randomise = useCallback(() => {
    const blocked = recentRecipeIds(
      history,
      weekPlan.weekId,
      household.noRepeatWeeks,
    )
    const { slots, errors } = randomiseUnlockedSlots(
      recipes,
      weekPlan.slots,
      blocked,
      household.oncePerWeekProteins,
    )
    const next: WeekPlan = {
      ...weekPlan,
      slots,
      acceptedAt: new Date().toISOString(),
    }
    setWeekPlan(next)
    return { errors }
  }, [
    history,
    weekPlan,
    household.noRepeatWeeks,
    household.oncePerWeekProteins,
    recipes,
    setWeekPlan,
  ])


  const getRecipe = useCallback(
    (id: string | null) => (id ? recipes.find((r) => r.id === id) : undefined),
    [recipes],
  )

  const cookName = useCallback(
    (id: CookId) => household.cooks.find((c) => c.id === id)?.name ?? id,
    [household],
  )

  const value: AppContextValue = {
    ready,
    error,
    recipes,
    rawRecipes,
    household,
    setHousehold,
    weekPlan,
    setWeekPlan,
    prefs,
    setUnitSystem,
    shop,
    toggleChecked,
    addExtra,
    removeExtra,
    addSauceToShop,
    removeSauceFromShop,
    clearShop,
    tagOverrides,
    updateTags,
    history,
    randomise,
    setSlot,
    assignRecipe,
    addMealThisWeek,
    removeMealThisWeek,
    ensureCurrentWeek,
    startNextWeek,
    getRecipe,
    cookName,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
