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

export interface Recipe {
  id: string
  title: string
  basePortions: number
  caloriesPerPortion?: number
  /** Prep + cook time in minutes (admin-set). */
  totalMinutes: number
  /** Optional thumbnail path under public/ (admin-set). */
  image?: string
  method: string[]
  cookTag: CookTag
  protein: Protein
  cuisine: Cuisine
  indulgence: Indulgence
  kidFriendly: boolean
  ingredients: Ingredient[]
  /** Page the method and amounts come from. Opens in a new tab. */
  sourceUrl?: string
  /** How this household changed the original. Shown under ingredients. */
  householdNotes?: string
}

export interface RecipeTagOverlay {
  cookTag?: CookTag
  protein?: Protein
  indulgence?: Indulgence
  kidFriendly?: boolean
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

export interface ShopState {
  checked: Record<string, boolean>
  extras: ShopExtra[]
}

export interface Prefs {
  unitSystem: UnitSystem
}

export interface EffectiveRecipe extends Recipe {
  // tags already merged with overlays
}
