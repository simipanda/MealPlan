import { Link, useParams } from 'react-router-dom'
import { HouseholdNotes } from '../components/HouseholdNotes'
import { IngredientLine } from '../components/IngredientLine'
import { SourceRecipeLink } from '../components/SourceRecipeLink'
import { useApp } from '../context/AppContext'

export function CookPage() {
  const { slotId } = useParams()
  const { weekPlan, getRecipe, prefs, setUnitSystem, cookName } = useApp()
  const slot = weekPlan.slots.find((s) => s.id === slotId)
  const recipe = getRecipe(slot?.recipeId ?? null)

  if (!slot || !recipe) {
    return (
      <div className="space-y-3">
        <p>No recipe assigned for this meal yet.</p>
        <Link to="/" className="text-forest underline">
          Back to plan
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      <Link to="/" className="text-sm font-semibold text-forest">
        ← Plan
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">
          Cook mode · {cookName(slot.cookId)} · {slot.portions} portions
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-display text-3xl text-ink">{recipe.title}</h1>
          <SourceRecipeLink url={recipe.sourceUrl} />
        </div>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUnitSystem('metric')}
          className={[
            'flex-1 rounded-xl py-2 text-sm font-bold',
            prefs.unitSystem === 'metric'
              ? 'bg-forest text-cream'
              : 'bg-cream-dark text-ink-muted',
          ].join(' ')}
        >
          UK metric
        </button>
        <button
          type="button"
          onClick={() => setUnitSystem('us')}
          className={[
            'flex-1 rounded-xl py-2 text-sm font-bold',
            prefs.unitSystem === 'us'
              ? 'bg-forest text-cream'
              : 'bg-cream-dark text-ink-muted',
          ].join(' ')}
        >
          US cups
        </button>
      </div>
      <p className="text-xs text-ink-muted">
        Primary unit follows the toggle; the other system stays in brackets for
        fast measuring.
      </p>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-2 font-display text-xl">Ingredients</h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Amounts are not stored in the app yet. Open the original recipe to
            cook, and use this week’s portion count as your scale.
          </p>
        ) : (
          <ul>
            {recipe.ingredients.map((ing) => (
              <IngredientLine
                key={`${ing.name}-${ing.unit}`}
                ingredient={ing}
                basePortions={recipe.basePortions}
                targetPortions={slot.portions}
                unitSystem={prefs.unitSystem}
                large
              />
            ))}
          </ul>
        )}
        <HouseholdNotes notes={recipe.householdNotes} />
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-3 font-display text-xl">Method</h2>
        <ol className="space-y-4">
          {recipe.method.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-cream">
                {i + 1}
              </span>
              <p className="pt-1 text-base leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
