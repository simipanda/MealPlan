import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CookTimeBadge } from '../components/CookTimeBadge'
import { IngredientLine } from '../components/IngredientLine'
import { ProteinBadge } from '../components/ProteinBadge'
import { RecipeThumb } from '../components/RecipeThumb'
import { useApp } from '../context/AppContext'
import { CUISINE_LABELS } from '../data/cuisines'
import type { CookTag, Indulgence } from '../types'

interface LocationState {
  from?: string
  fromLabel?: string
}

export function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = (location.state as LocationState | null) ?? null
  const {
    getRecipe,
    prefs,
    setUnitSystem,
    updateTags,
    cookName,
    household,
    weekPlan,
  } = useApp()
  const [editingTags, setEditingTags] = useState(false)
  const recipe = getRecipe(id ?? null)

  function goBack() {
    if (navState?.from) {
      navigate(navState.from)
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  const backLabel = navState?.fromLabel
    ? `← ${navState.fromLabel}`
    : '← Back'


  const planSlot = useMemo(
    () => weekPlan.slots.find((s) => s.recipeId === recipe?.id),
    [weekPlan.slots, recipe?.id],
  )

  if (!recipe) {
    return (
      <div className="space-y-3">
        <p>Recipe not found.</p>
        <button type="button" onClick={goBack} className="text-forest underline">
          {backLabel}
        </button>
      </div>
    )
  }

  const targetPortions = planSlot?.portions ?? recipe.basePortions
  const scaledForPlan = Boolean(planSlot)
  const cookLabel =
    recipe.cookTag === 'either'
      ? 'Either'
      : cookName(recipe.cookTag === 'cook1' ? 'cook1' : 'cook2')

  return (
    <div className="space-y-5 pb-8">
      <button
        type="button"
        onClick={goBack}
        className="text-sm font-semibold text-forest"
      >
        {backLabel}
      </button>

      <RecipeThumb
        title={recipe.title}
        protein={recipe.protein}
        image={recipe.image}
        size="lg"
      />

      <header>
        <h1 className="font-display text-3xl text-ink">{recipe.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {scaledForPlan ? (
            <>
              This week:{' '}
              <strong className="text-ink">{targetPortions} portions</strong>
              <span className="text-ink-muted">
                {' '}
                (recipe base {recipe.basePortions}
                {planSlot ? ` · ${cookName(planSlot.cookId)}` : ''})
              </span>
            </>
          ) : (
            <>Base {recipe.basePortions} portions</>
          )}
          {recipe.caloriesPerPortion != null
            ? ` · ~${recipe.caloriesPerPortion} kcal/portion`
            : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ProteinBadge protein={recipe.protein} size="md" />
          <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-semibold text-ink-muted">
            {CUISINE_LABELS[recipe.cuisine]}
          </span>
          <CookTimeBadge
            totalMinutes={recipe.totalMinutes}
            size="md"
            showBand
          />
          <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-semibold text-ink-muted">
            {cookLabel}
          </span>
          <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-semibold capitalize text-ink-muted">
            {recipe.indulgence}
          </span>
          {recipe.kidFriendly && (
            <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-semibold text-ink-muted">
              Kid-friendly
            </span>
          )}
          <button
            type="button"
            onClick={() => setEditingTags((v) => !v)}
            className="rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-forest"
          >
            {editingTags ? 'Done' : 'Edit tags'}
          </button>
        </div>
      </header>

      {editingTags && (
        <section className="rounded-2xl border border-forest/25 bg-card p-4">
          <h2 className="mb-1 font-display text-lg">Edit tags</h2>
          <p className="mb-3 text-xs text-ink-muted">
            Protein is set when the recipe is added to the book and can’t be
            changed here.
          </p>
          <label className="mb-3 block text-sm">
            <span className="mb-1 block font-semibold text-ink-muted">Cook</span>
            <select
              className="w-full rounded-xl border border-line bg-cream px-3 py-2"
              value={recipe.cookTag}
              onChange={(e) =>
                updateTags(recipe.id, { cookTag: e.target.value as CookTag })
              }
            >
              <option value="cook1">{household.cooks[0].name}</option>
              <option value="cook2">{household.cooks[1].name}</option>
              <option value="either">Either</option>
            </select>
          </label>
          <label className="mb-3 block text-sm">
            <span className="mb-1 block font-semibold text-ink-muted">
              Indulgence
            </span>
            <select
              className="w-full rounded-xl border border-line bg-cream px-3 py-2"
              value={recipe.indulgence}
              onChange={(e) =>
                updateTags(recipe.id, {
                  indulgence: e.target.value as Indulgence,
                })
              }
            >
              <option value="light">Light / balanced</option>
              <option value="rich">Rich / cheesy</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={recipe.kidFriendly}
              onChange={(e) =>
                updateTags(recipe.id, { kidFriendly: e.target.checked })
              }
            />
            Kid-friendly
          </label>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg">Ingredients</h2>
            {scaledForPlan && (
              <p className="text-xs text-ink-muted">
                Amounts scaled to {targetPortions} portions for this week’s plan
              </p>
            )}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-cream-dark px-3 py-1 text-xs font-bold"
            onClick={() =>
              setUnitSystem(prefs.unitSystem === 'metric' ? 'us' : 'metric')
            }
          >
            {prefs.unitSystem === 'metric' ? 'UK metric' : 'US cups'}
          </button>
        </div>
        <ul>
          {recipe.ingredients.map((ing) => (
            <IngredientLine
              key={`${ing.name}-${ing.unit}`}
              ingredient={ing}
              basePortions={recipe.basePortions}
              targetPortions={targetPortions}
              unitSystem={prefs.unitSystem}
            />
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-2 font-display text-lg">Method</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {recipe.method.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      {planSlot && (
        <Link
          to={`/cook/${planSlot.id}`}
          className="block rounded-2xl bg-forest py-3 text-center font-bold text-cream"
        >
          Open cook mode · {targetPortions} portions
        </Link>
      )}
    </div>
  )
}
