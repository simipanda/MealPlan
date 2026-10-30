import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatAmountLine, formatIngredientAmount } from '../lib/units'
import { isSauceRecipe } from '../lib/recipes'
import { buildShopLines } from '../lib/shop'
import { useApp } from '../context/AppContext'

export function ShopPage() {
  const {
    weekPlan,
    recipes,
    cookName,
    shop,
    toggleChecked,
    addExtra,
    removeExtra,
    addSauceToShop,
    removeSauceFromShop,
    clearShop,
    prefs,
    startNextWeek,
  } = useApp()
  const [extraText, setExtraText] = useState('')
  const [saucePick, setSaucePick] = useState('')

  const sauces = shop.sauces ?? []
  const sauceRecipes = useMemo(
    () => recipes.filter(isSauceRecipe).sort((a, b) => a.title.localeCompare(b.title)),
    [recipes],
  )
  const unusedSauces = useMemo(
    () => sauceRecipes.filter((r) => !sauces.some((s) => s.recipeId === r.id)),
    [sauceRecipes, sauces],
  )

  const lines = useMemo(() => {
    const labels = {
      cook1: cookName('cook1'),
      cook2: cookName('cook2'),
    }
    return buildShopLines(
      weekPlan.slots,
      recipes,
      labels,
      shop.extras,
      sauces,
    )
  }, [weekPlan.slots, recipes, cookName, shop.extras, sauces])

  function submitExtra(e: FormEvent) {
    e.preventDefault()
    addExtra(extraText)
    setExtraText('')
  }

  function submitSauce(e: FormEvent) {
    e.preventDefault()
    if (!saucePick) return
    addSauceToShop(saucePick)
    setSaucePick('')
  }

  return (
    <div className="space-y-4 pb-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">
          Sunday shop
        </p>
        <h1 className="font-display text-3xl text-ink">Shopping list</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Merged for the week · tick as you bag · extras & sauces don’t carry
          over
        </p>
      </header>

      {lines.filter((l) => !l.isExtra).length === 0 && (
        <p className="rounded-xl bg-cream-dark/80 p-4 text-sm text-ink-muted">
          No planned meals or sauces yet. Add dinners on Plan, or pull a
          dressing into the shop below.
        </p>
      )}

      <ul className="space-y-1">
        {lines.map((line) => {
          const checked = Boolean(shop.checked[line.key])
          const amount =
            line.isExtra || line.qty === null
              ? null
              : formatAmountLine(
                  formatIngredientAmount(
                    { name: line.name, qty: line.qty, unit: line.unit },
                    1,
                    1,
                    prefs.unitSystem,
                  ),
                )

          return (
            <li
              key={line.key}
              className={[
                'flex items-start gap-3 rounded-xl border border-line bg-card px-3 py-3',
                checked ? 'opacity-50' : '',
              ].join(' ')}
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-forest"
                checked={checked}
                onChange={() => toggleChecked(line.key)}
                aria-label={`Got ${line.name}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={[
                    'font-semibold',
                    checked ? 'line-through' : '',
                  ].join(' ')}
                >
                  {line.name}
                  {amount ? (
                    <span className="ml-2 font-normal text-ink-muted">
                      {amount}
                    </span>
                  ) : null}
                </p>
                {line.fromMeals.length > 0 && (
                  <p className="text-xs text-ink-muted">
                    {line.fromMeals.join(' · ')}
                  </p>
                )}
                {line.isExtra && (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-clay"
                    onClick={() => line.extraId && removeExtra(line.extraId)}
                  >
                    Remove extra
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <section className="space-y-2 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-display text-lg text-ink">Dressings & sauces</h2>
        <p className="text-xs text-ink-muted">
          Pull a book sauce into this week’s list when you want it with a meal.
          Ingredients merge with the shop; not on the meal plan.
        </p>
        {sauces.length > 0 && (
          <ul className="space-y-2">
            {sauces.map((add) => {
              const recipe = recipes.find((r) => r.id === add.recipeId)
              if (!recipe) return null
              return (
                <li
                  key={add.recipeId}
                  className="flex items-center justify-between gap-2 rounded-xl bg-cream-dark/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/recipes/${recipe.id}`}
                      className="font-semibold text-forest"
                    >
                      {recipe.title}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {add.portions} portion
                      {add.portions === 1 ? '' : 's'} of ingredients
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-clay"
                    onClick={() => removeSauceFromShop(add.recipeId)}
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {unusedSauces.length > 0 ? (
          <form onSubmit={submitSauce} className="flex gap-2">
            <select
              value={saucePick}
              onChange={(e) => setSaucePick(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-3 py-3 text-sm"
            >
              <option value="">Add a sauce…</option>
              {unusedSauces.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!saucePick}
              className="rounded-xl bg-forest px-4 py-3 font-bold text-cream disabled:opacity-40"
            >
              Add
            </button>
          </form>
        ) : (
          <p className="text-xs text-ink-muted">
            {sauceRecipes.length === 0
              ? 'No dressings in the book yet.'
              : 'All book sauces are already on this week’s shop.'}
          </p>
        )}
      </section>

      <form onSubmit={submitExtra} className="flex gap-2">
        <input
          value={extraText}
          onChange={(e) => setExtraText(e.target.value)}
          placeholder="Add extra (e.g. toilet paper)"
          className="flex-1 rounded-xl border border-line bg-card px-3 py-3"
        />
        <button
          type="submit"
          className="rounded-xl bg-forest px-4 py-3 font-bold text-cream"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={clearShop}
          className="rounded-xl border border-line py-3 text-sm font-semibold text-ink-muted"
        >
          Clear ticks, extras & sauces
        </button>
        <button
          type="button"
          onClick={startNextWeek}
          className="rounded-xl bg-cream-dark py-3 text-sm font-semibold text-ink"
        >
          Clear shop / start next week
        </button>
      </div>
    </div>
  )
}
