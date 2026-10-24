import { useMemo, useState, type FormEvent } from 'react'
import { formatAmountLine, formatIngredientAmount } from '../lib/units'
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
    clearShop,
    prefs,
    startNextWeek,
  } = useApp()
  const [extraText, setExtraText] = useState('')

  const lines = useMemo(() => {
    const labels = {
      cook1: cookName('cook1'),
      cook2: cookName('cook2'),
    }
    return buildShopLines(weekPlan.slots, recipes, labels, shop.extras)
  }, [weekPlan.slots, recipes, cookName, shop.extras])

  function submitExtra(e: FormEvent) {
    e.preventDefault()
    addExtra(extraText)
    setExtraText('')
  }

  return (
    <div className="space-y-4 pb-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">
          Sunday shop
        </p>
        <h1 className="font-display text-3xl text-ink">Shopping list</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Merged for the week · tick as you bag · extras don’t carry over
        </p>
      </header>

      {lines.filter((l) => !l.isExtra).length === 0 && (
        <p className="rounded-xl bg-cream-dark/80 p-4 text-sm text-ink-muted">
          No planned meals yet. Randomise or pick recipes on the Plan tab first.
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
          Clear ticks & extras
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
