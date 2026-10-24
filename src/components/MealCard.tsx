import { Link } from 'react-router-dom'
import { DAY_LABELS } from '../data/defaultHousehold'
import { CUISINE_LABELS } from '../data/cuisines'
import { CookTimeBadge } from './CookTimeBadge'
import { ProteinBadge } from './ProteinBadge'
import type { CookId, DayIndex, EffectiveRecipe, MealSlot } from '../types'

interface Props {
  mealNumber: number
  slot: MealSlot
  blockedDays: Partial<Record<DayIndex, string>>
  canRemove: boolean
  recipe?: EffectiveRecipe
  spinning?: boolean
  onToggleLock: () => void
  onPortionsChange: (n: number) => void
  onToggleCoverDay: (day: DayIndex) => void
  onCookChange: (cookId: CookId) => void
  onRemove: () => void
  cookOptions: { id: CookId; name: string }[]
}

export function MealCard({
  mealNumber,
  slot,
  blockedDays,
  canRemove,
  recipe,
  spinning,
  onToggleLock,
  onPortionsChange,
  onToggleCoverDay,
  onCookChange,
  onRemove,
  cookOptions,
}: Props) {
  const covers = slot.coverDays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(' · ')

  return (
    <article
      className={[
        'rounded-2xl border border-line bg-card p-4 shadow-sm',
        spinning ? 'animate-card-reveal' : '',
      ].join(' ')}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-clay">
            Meal {mealNumber}
          </p>
          <select
            className="mt-1 rounded-lg border border-line bg-cream px-2 py-1 font-display text-xl text-ink"
            value={slot.cookId}
            onChange={(e) => onCookChange(e.target.value as CookId)}
            aria-label="Cook for this meal"
          >
            {cookOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={onToggleLock}
            className={[
              'rounded-full px-3 py-1 text-xs font-bold',
              slot.locked
                ? 'bg-forest text-cream'
                : 'bg-cream-dark text-ink-muted',
            ].join(' ')}
          >
            {slot.locked ? 'Locked' : 'Unlocked'}
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] font-semibold text-clay"
            >
              Remove meal
            </button>
          )}
        </div>
      </header>

      {recipe ? (
        <div className="mb-3">
          <Link
            to={`/cook/${slot.id}`}
            className="font-display text-2xl leading-tight text-forest hover:text-forest-deep"
          >
            {recipe.title}
          </Link>
          {covers && (
            <p className="mt-1 text-sm text-ink-muted">Covers {covers}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <ProteinBadge protein={recipe.protein} size="md" />
            <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[11px] font-semibold">
              {CUISINE_LABELS[recipe.cuisine]}
            </span>
            <CookTimeBadge totalMinutes={recipe.totalMinutes} />
            <span className="rounded-full bg-cream-dark px-2 py-0.5 capitalize">
              {recipe.indulgence}
            </span>
            {recipe.caloriesPerPortion != null && (
              <span className="rounded-full bg-cream-dark px-2 py-0.5">
                ~{recipe.caloriesPerPortion} kcal/portion
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="mb-3 font-display text-xl text-ink-muted">No recipe yet</p>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-ink-muted">
          Portions this week
          <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal">
            Sets cook + reheat nights on the strip
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-full bg-cream-dark text-lg font-bold"
            onClick={() => onPortionsChange(Math.max(1, slot.portions - 1))}
            aria-label="Fewer portions"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-bold tabular-nums">
            {slot.portions}
          </span>
          <button
            type="button"
            className="h-8 w-8 rounded-full bg-cream-dark text-lg font-bold"
            onClick={() => onPortionsChange(slot.portions + 1)}
            aria-label="More portions"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Coverage this week
        </p>
        <div className="flex flex-wrap gap-1">
          {DAY_LABELS.map((label, day) => {
            const d = day as DayIndex
            const on = slot.coverDays.includes(d)
            const blockedBy = blockedDays[d]
            const blocked = Boolean(blockedBy) && !on
            return (
              <button
                key={label}
                type="button"
                disabled={blocked}
                title={
                  blocked
                    ? `Already covered by ${blockedBy}`
                    : on
                      ? `Remove ${label}`
                      : `Add ${label}`
                }
                onClick={() => onToggleCoverDay(d)}
                className={[
                  'rounded-md px-2 py-1 text-xs font-semibold',
                  on
                    ? 'bg-forest text-cream'
                    : blocked
                      ? 'cursor-not-allowed bg-cream-dark/40 text-ink-muted/50 line-through'
                      : 'bg-cream-dark text-ink-muted',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          to={`/recipes?assign=${slot.id}`}
          className="flex-1 rounded-xl border border-line py-2 text-center text-sm font-semibold text-forest"
        >
          Pick recipe
        </Link>
        {recipe && (
          <Link
            to={`/recipes/${recipe.id}`}
            state={{ from: '/', fromLabel: 'Plan' }}
            className="flex-1 rounded-xl bg-cream-dark py-2 text-center text-sm font-semibold text-ink"
          >
            Details
          </Link>
        )}
      </div>
    </article>
  )
}
