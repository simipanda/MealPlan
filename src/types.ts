export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CookId = 'cook1' | 'cook2'

export type CookTag = CookId | 'either'

/** red = beef, white = poultry (chicken, turkey, …) */
export type Protein = 'red' | 'lamb' | 'white' | 'pork' | 'fish' | 'veg'

export type Indulgence = 'light' | 'rich'

/** Admin-set cuisine / food style for browse + filter. */
export type Cuisine =
  | 'mexican'
  | 'italian'
  | 'american'
  | 'british'
  | 'japanese'
  | 'thai'
  | 'korean'
  | 'indian'
  | 'chinese'
  | 'lithuanian'
  | 'caribbean'
  | 'african'
  | 'middleEastern'
  | 'greek'
  | 'spanish'
  | 'misc'

export type IngredientUnit =
  | 'g'
  | 'ml'
  | 'tsp'
  | 'tbsp'
  | 'each'
  | 'tin'
  | 'toTaste'
  | 'pinch'
  | 'clove'

export type UnitSystem = 'metric' | 'us'

export interface Ingredient {
  name: string
  qty: number | null
  unit: IngredientUnit
}

export type CookTimeBand = 'easy' | 'medium' | 'hard'

/**
 * Where the recipe lives in the book.
 * `meal` — dinners on the week plan.
 * `sauce` — dressings, sauces, condiments (reuse only; not planned).
 */
export type RecipeCatalog = 'meal' | 'sauce'

export interface Recipe {
  id: string
  title: string
  basePortions: number
  /**
   * Approx kcal for **one portion** (one person’s plate), not the whole pot.
   * Head maths: portions × this number ≈ meal total.
   */
  caloriesPerPortion?: number
  /** Prep + cook time in minutes (admin-set). */
  totalMinutes: number
  /** Optional thumbnail path under public/ (admin-set). */
  image?: string
  method: string[]
  cookTag: CookTag
  protein: Protein
  /** Defaults to `meal` when omitted. */
  catalog?: RecipeCatalog
  /**
   * Optional alternate proteins for this dish (e.g. pork ↔ chicken).
   * Amounts stay the same; local overlay picks the active one.
   */
  proteinOptions?: Protein[]
  /** Short labels for swap chips (e.g. white → "Turkey mince"). */
  proteinOptionLabels?: Partial<Record<Protein, string>>
  cuisine: Cuisine
  indulgence: Indulgence
  kidFriendly: boolean
  ingredients: Ingredient[]
  /** Page the method and amounts come from. Opens in a new tab. */
  sourceUrl?: string
}

export interface RecipeTagOverlay {
  cookTag?: CookTag
  /** Active protein when the recipe allows swaps. */
  protein?: Protein
  indulgence?: Indulgence
  kidFriendly?: boolean
  /** 1–5 household star rating; omit or 0 = unrated. Local only. */
  rating?: number
}

export interface Cook {
  id: CookId
  name: string
}

/** Default meal in the household weekly pattern (Settings). */
export interface MealTemplate {
  id: string
  cookId: CookId
  coverDays: DayIndex[]
  portions: number
}

export interface Household {
  cooks: [Cook, Cook]
  weekStartDay: DayIndex
  noRepeatWeeks: number
  peoplePerMeal: number
  /**
   * Proteins that may appear at most once each in a week’s plan
   * (e.g. beef once, pork once, fish once). Unticked = can repeat.
   */
  oncePerWeekProteins: Protein[]
  /** How many / which meals a new week starts with. */
  mealTemplates: MealTemplate[]
}

export interface MealSlot {
  id: string
  cookId: CookId
  recipeId: string | null
  locked: boolean
  portions: number
  coverDays: DayIndex[]
}

export interface WeekPlan {
  weekId: string
  slots: MealSlot[]
  acceptedAt: string | null
}

export interface PlanHistoryEntry {
  weekId: string
  recipeIds: string[]
}

export interface ShopExtra {
  id: string
  label: string
}

/** Dressing/sauce from the book, pulled into this week’s shop only. */
export interface ShopSauceAdd {
  recipeId: string
  /** Scales the sauce recipe’s basePortions (default = one full recipe batch). */
  portions: number
}

export interface ShopState {
  checked: Record<string, boolean>
  extras: ShopExtra[]
  /** Sauces/dressings whose ingredients join the shop list this week. */
  sauces: ShopSauceAdd[]
}

export interface Prefs {
  unitSystem: UnitSystem
}

export interface EffectiveRecipe extends Recipe {
  /** Published default protein before local swap overlay. */
  baseProtein: Protein
  /** Local star rating 1–5, or null if unrated. */
  rating: number | null
}
