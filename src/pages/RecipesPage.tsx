import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CookTimeBadge } from '../components/CookTimeBadge'
import { IndulgenceBadge } from '../components/IndulgenceBadge'
import { ProteinBadge } from '../components/ProteinBadge'
import { RecipeThumb } from '../components/RecipeThumb'
import { StarRating } from '../components/StarRating'
import { useApp } from '../context/AppContext'
import { ALL_CUISINES, CUISINE_LABELS } from '../data/cuisines'
import { ALL_PROTEINS, PROTEIN_LABELS } from '../data/proteinIcons'
import {
  COOK_TIME_BANDS,
  COOK_TIME_LABELS,
  cookTimeBand,
} from '../lib/cookTime'
import { manualPickStatus, type PickBlockKind } from '../lib/randomise'
import { isMealRecipe, recipeCatalog } from '../lib/recipes'
import { recentRecipeIds } from '../lib/week'
import type {
  CookTag,
  CookTimeBand,
  Cuisine,
  Indulgence,
  Protein,
  RecipeCatalog,
} from '../types'

const BLOCK_STYLES: Record<
  PickBlockKind,
  { card: string; reason: string; title: string }
> = {
  already_planned: {
    card: 'border-[#c45c26]/35 bg-[#c45c26]/10',
    reason: 'text-[#c45c26]',
    title: 'line-through text-[#c45c26]/80',
  },
  recent_history: {
    card: 'border-[#78716c]/35 bg-[#78716c]/10',
    reason: 'text-[#57534e]',
    title: 'line-through text-[#78716c]',
  },
  protein_limit: {
    card: 'border-[#6b2d2d]/35 bg-[#6b2d2d]/10',
    reason: 'text-[#6b2d2d]',
    title: 'line-through text-[#6b2d2d]/80',
  },
  rich: {
    card: 'border-[#7c3aed]/30 bg-[#7c3aed]/10',
    reason: 'text-[#6d28d9]',
    title: 'line-through text-[#7c3aed]/80',
  },
  cuisine: {
    card: 'border-[#0e7490]/30 bg-[#0e7490]/8',
    reason: 'text-[#0e7490]',
    title: 'line-through text-[#0e7490]/80',
  },
  cuisine_family: {
    card: 'border-[#0e7490]/30 bg-[#0e7490]/8',
    reason: 'text-[#0e7490]',
    title: 'line-through text-[#0e7490]/80',
  },
  wrong_cook: {
    card: 'border-[#0e7490]/30 bg-[#0e7490]/8',
    reason: 'text-[#0e7490]',
    title: 'line-through text-[#0e7490]/80',
  },
  unavailable: {
    card: 'border-line/60 bg-cream-dark/40',
    reason: 'text-ink-muted',
    title: 'line-through text-ink-muted',
  },
  not_a_meal: {
    card: 'border-line/60 bg-cream-dark/40',
    reason: 'text-ink-muted',
    title: 'line-through text-ink-muted',
  },
}

type ProteinFilter = 'all' | Protein
type CuisineFilter = 'all' | Cuisine
type TimeFilter = 'all' | CookTimeBand
type CookFilter = 'all' | CookTag
type IndulgenceFilter = 'all' | Indulgence
type KidsFilter = 'all' | 'yes' | 'no'

const selectClass =
  'rounded-xl border border-line bg-card px-2.5 py-2 text-xs font-semibold text-ink'

const CATALOG_LABELS: Record<RecipeCatalog, string> = {
  meal: 'Meals',
  sauce: 'Dressings & sauces',
}

export function RecipesPage() {
  const {
    recipes,
    household,
    assignRecipe,
    cookName,
    weekPlan,
    history,
  } = useApp()
  const [q, setQ] = useState('')
  const [catalog, setCatalog] = useState<RecipeCatalog>('meal')
  const [proteinFilter, setProteinFilter] = useState<ProteinFilter>('all')
  const [cuisineFilter, setCuisineFilter] = useState<CuisineFilter>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [cookFilter, setCookFilter] = useState<CookFilter>('all')
  const [indulgenceFilter, setIndulgenceFilter] =
    useState<IndulgenceFilter>('all')
  const [kidsFilter, setKidsFilter] = useState<KidsFilter>('all')
  const [params] = useSearchParams()
  const assignSlotId = params.get('assign')
  const navigate = useNavigate()

  const slotIndex = assignSlotId
    ? weekPlan.slots.findIndex((s) => s.id === assignSlotId)
    : -1
  const assignSlot = slotIndex >= 0 ? weekPlan.slots[slotIndex] : null
  // Assigning a meal slot → meals only
  const activeCatalog: RecipeCatalog = assignSlot ? 'meal' : catalog

  const blockedHistory = useMemo(
    () =>
      recentRecipeIds(history, weekPlan.weekId, household.noRepeatWeeks),
    [history, weekPlan.weekId, household.noRepeatWeeks],
  )

  const catalogCounts = useMemo(() => {
    const counts: Record<RecipeCatalog, number> = { meal: 0, sauce: 0 }
    for (const r of recipes) counts[recipeCatalog(r)] += 1
    return counts
  }, [recipes])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return recipes.filter((r) => {
      if (recipeCatalog(r) !== activeCatalog) return false
      if (needle) {
        const cuisineLabel = CUISINE_LABELS[r.cuisine].toLowerCase()
        const hit =
          r.title.toLowerCase().includes(needle) ||
          r.protein.includes(needle) ||
          r.indulgence.includes(needle) ||
          r.cuisine.toLowerCase().includes(needle) ||
          cuisineLabel.includes(needle)
        if (!hit) return false
      }
      if (proteinFilter !== 'all' && r.protein !== proteinFilter) return false
      if (cuisineFilter !== 'all' && r.cuisine !== cuisineFilter) return false
      if (
        timeFilter !== 'all' &&
        cookTimeBand(r.totalMinutes) !== timeFilter
      ) {
        return false
      }
      if (cookFilter !== 'all' && r.cookTag !== cookFilter) return false
      if (indulgenceFilter !== 'all' && r.indulgence !== indulgenceFilter) {
        return false
      }
      if (kidsFilter === 'yes' && !r.kidFriendly) return false
      if (kidsFilter === 'no' && r.kidFriendly) return false
      return true
    })
  }, [
    recipes,
    q,
    activeCatalog,
    proteinFilter,
    cuisineFilter,
    timeFilter,
    cookFilter,
    indulgenceFilter,
    kidsFilter,
  ])

  const rows = useMemo(() => {
    if (!assignSlot || slotIndex < 0) {
      return filtered.map((recipe) => ({ recipe, status: null as null }))
    }
    return filtered.map((recipe) => ({
      recipe,
      status: manualPickStatus(recipe, {
        recipes,
        slots: weekPlan.slots,
        slotIndex,
        blockedRecipeIds: blockedHistory,
        oncePerWeekProteins: household.oncePerWeekProteins,
      }),
    }))
  }, [
    assignSlot,
    slotIndex,
    filtered,
    recipes,
    weekPlan.slots,
    blockedHistory,
    household.oncePerWeekProteins,
  ])

  function cookLabel(tag: string) {
    if (tag === 'either') return 'Either'
    if (tag === 'cook1' || tag === 'cook2') return cookName(tag)
    return tag
  }

  function onAssign(recipeId: string, overrideCookTag = false) {
    if (!assignSlotId) return
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe || !isMealRecipe(recipe)) return
    assignRecipe(assignSlotId, recipeId, { lock: true, overrideCookTag })
    navigate('/')
  }

  function recipeMeta(recipe: (typeof recipes)[0]) {
    return (
      <div className="mt-1.5 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <ProteinBadge protein={recipe.protein} />
          {recipe.rating != null && (
            <StarRating value={recipe.rating} editable={false} size="sm" />
          )}
          <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
            {CUISINE_LABELS[recipe.cuisine]}
          </span>
          <CookTimeBadge totalMinutes={recipe.totalMinutes} showBand />
          <IndulgenceBadge indulgence={recipe.indulgence} />
        </div>
        <p className="text-xs text-ink-muted">
          {cookLabel(recipe.cookTag)}
          {recipe.kidFriendly ? ' · kids' : ''}
          {recipe.caloriesPerPortion != null
            ? ` · ~${recipe.caloriesPerPortion} kcal/portion`
            : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">
          Recipe book
        </p>
        <h1 className="font-display text-3xl text-ink">Recipes</h1>
        {assignSlot && (
          <p className="mt-1 rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest">
            Pick a meal for <strong>{cookName(assignSlot.cookId)}</strong>.
            Dressings stay in their own book section and can’t be planned.
          </p>
        )}
      </header>

      {!assignSlot && (
        <div className="flex gap-2">
          {(['meal', 'sauce'] as const).map((key) => {
            const on = catalog === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCatalog(key)}
                className={[
                  'flex-1 rounded-xl px-3 py-2.5 text-sm font-bold',
                  on ? 'bg-forest text-cream' : 'bg-cream-dark text-ink-muted',
                ].join(' ')}
              >
                {CATALOG_LABELS[key]}
                <span className="ml-1 font-semibold opacity-80">
                  ({catalogCounts[key]})
                </span>
              </button>
            )
          })}
        </div>
      )}

      {activeCatalog === 'sauce' && (
        <p className="rounded-xl bg-cream-dark/80 px-3 py-2 text-sm text-ink-muted">
          Dressings and sauces for reuse — not part of the week meal plan.
        </p>
      )}

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title, cuisine…"
        className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Protein
          </span>
          <select
            className={`w-full ${selectClass}`}
            value={proteinFilter}
            onChange={(e) =>
              setProteinFilter(e.target.value as ProteinFilter)
            }
          >
            <option value="all">All</option>
            {ALL_PROTEINS.map((p) => (
              <option key={p} value={p}>
                {PROTEIN_LABELS[p]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Cuisine
          </span>
          <select
            className={`w-full ${selectClass}`}
            value={cuisineFilter}
            onChange={(e) =>
              setCuisineFilter(e.target.value as CuisineFilter)
            }
          >
            <option value="all">All</option>
            {ALL_CUISINES.map((c) => (
              <option key={c} value={c}>
                {CUISINE_LABELS[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Cook time
          </span>
          <select
            className={`w-full ${selectClass}`}
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          >
            <option value="all">All</option>
            {COOK_TIME_BANDS.map((b) => (
              <option key={b} value={b}>
                {COOK_TIME_LABELS[b]}
                {b === 'easy'
                  ? ' (≤30)'
                  : b === 'medium'
                    ? ' (31–60)'
                    : ' (61+)'}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Cook
          </span>
          <select
            className={`w-full ${selectClass}`}
            value={cookFilter}
            onChange={(e) => setCookFilter(e.target.value as CookFilter)}
          >
            <option value="all">All</option>
            <option value="cook1">{cookName('cook1')}</option>
            <option value="cook2">{cookName('cook2')}</option>
            <option value="either">Either</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Style
          </span>
          <select
            className={`w-full ${selectClass}`}
            value={indulgenceFilter}
            onChange={(e) =>
              setIndulgenceFilter(e.target.value as IndulgenceFilter)
            }
          >
            <option value="all">All</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="rich">Rich</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Kids
          </span>
          <select
            className={`w-full ${selectClass}`}
            value={kidsFilter}
            onChange={(e) => setKidsFilter(e.target.value as KidsFilter)}
          >
            <option value="all">All</option>
            <option value="yes">Kid-friendly</option>
            <option value="no">Not for kids</option>
          </select>
        </label>
      </div>

      <ul className="space-y-2">
        {rows.map(({ recipe, status }) => {
          const blocked = status !== null && status.ok === false
          const current = status !== null && status.ok && status.current
          const canOverride =
            blocked &&
            status &&
            !status.ok &&
            status.allowCookOverride === true &&
            status.kind === 'wrong_cook'
          const blockStyle =
            blocked && status && !status.ok
              ? BLOCK_STYLES[status.kind]
              : null

          if (!assignSlot) {
            return (
              <li key={recipe.id}>
                <Link
                  to={`/recipes/${recipe.id}`}
                  state={{ from: '/recipes', fromLabel: 'Recipes' }}
                  className="flex gap-3 rounded-2xl border border-line bg-card p-3"
                >
                  <RecipeThumb
                    title={recipe.title}
                    protein={recipe.protein}
                    image={recipe.image}
                    size="sm"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-display text-xl leading-tight text-ink">
                      {recipe.title}
                    </span>
                    {recipeMeta(recipe)}
                  </span>
                </Link>
              </li>
            )
          }

          return (
            <li key={recipe.id}>
              <div
                className={[
                  'relative flex gap-3 rounded-2xl border p-3',
                  blocked && blockStyle
                    ? blockStyle.card
                    : current
                      ? 'border-forest bg-forest/10'
                      : 'border-line bg-card',
                ].join(' ')}
              >
                {canOverride && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssign(recipe.id, true)
                    }}
                    className="absolute right-3 top-3 z-10 rounded-full border border-forest/30 bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-forest shadow-sm"
                    title="Assign this week only — does not change the recipe tag"
                  >
                    Override
                  </button>
                )}

                <RecipeThumb
                  title={recipe.title}
                  protein={recipe.protein}
                  image={recipe.image}
                  size="sm"
                />

                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => {
                    if (!blocked) onAssign(recipe.id)
                  }}
                  className={[
                    'flex min-w-0 flex-1 flex-col text-left',
                    canOverride ? 'pr-16' : '',
                    blocked ? 'cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'font-display text-xl leading-tight',
                      blocked && blockStyle
                        ? blockStyle.title
                        : 'text-ink',
                    ].join(' ')}
                  >
                    {recipe.title}
                  </span>
                  {recipeMeta(recipe)}
                  {blocked && status && !status.ok && blockStyle && (
                    <span
                      className={[
                        'mt-2 text-xs font-semibold',
                        blockStyle.reason,
                      ].join(' ')}
                    >
                      {status.reason}
                    </span>
                  )}
                  {current && (
                    <span className="mt-2 text-xs font-semibold text-forest">
                      Currently selected — tap to keep
                    </span>
                  )}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-sm text-ink-muted">No recipes match.</p>
      )}

      <p className="text-xs text-ink-muted">
        {household.cooks.map((c) => c.name).join(' & ')} · showing{' '}
        {filtered.length} of {catalogCounts[activeCatalog]}{' '}
        {CATALOG_LABELS[activeCatalog].toLowerCase()}
      </p>
    </div>
  )
}
