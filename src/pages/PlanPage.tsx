import { useMemo, useState } from 'react'
import { MealCard } from '../components/MealCard'
import { WeekStrip } from '../components/WeekStrip'
import { useApp } from '../context/AppContext'
import { DAY_LABELS } from '../data/defaultHousehold'
import {
  cookNightFromCover,
  syncSlotFromCoverDays,
  syncSlotFromPortions,
} from '../lib/coverage'
import { redMeatConflictWarning } from '../lib/randomise'
import { orderedSlots } from '../lib/week'
import type { CookId, DayIndex, EffectiveRecipe } from '../types'

export function PlanPage() {
  const {
    household,
    weekPlan,
    recipes,
    setSlot,
    addMealThisWeek,
    removeMealThisWeek,
    randomise,
  } = useApp()
  const [spinning, setSpinning] = useState(false)
  const [randomiseNote, setRandomiseNote] = useState<string | null>(null)

  const slots = useMemo(
    () => orderedSlots(weekPlan.slots, household),
    [weekPlan.slots, household],
  )

  const recipesBySlot = useMemo(() => {
    const map: Record<string, EffectiveRecipe> = {}
    for (const slot of slots) {
      if (!slot.recipeId) continue
      const r = recipes.find((x) => x.id === slot.recipeId)
      if (r) map[slot.id] = r
    }
    return map
  }, [slots, recipes])

  const cookOptions = household.cooks.map((c) => ({ id: c.id, name: c.name }))

  const redMeatWarning = useMemo(
    () =>
      redMeatConflictWarning(
        weekPlan.slots,
        recipes,
        household.oncePerWeekProteins,
      ),
    [weekPlan.slots, recipes, household.oncePerWeekProteins],
  )

  function cookName(cookId: CookId) {
    return household.cooks.find((c) => c.id === cookId)?.name ?? cookId
  }

  function blockedDaysFor(slotId: string): Partial<Record<DayIndex, string>> {
    const blocked: Partial<Record<DayIndex, string>> = {}
    for (const other of slots) {
      if (other.id === slotId) continue
      const name = cookName(other.cookId)
      for (const d of other.coverDays) blocked[d] = name
    }
    return blocked
  }

  function blockedDaySet(slotId: string): Set<DayIndex> {
    const blocked = new Set<DayIndex>()
    for (const other of weekPlan.slots) {
      if (other.id === slotId) continue
      for (const d of other.coverDays) blocked.add(d)
    }
    return blocked
  }

  /** Portions drive how many evenings the week strip covers. */
  function changePortions(slotId: string, portions: number) {
    const slot = weekPlan.slots.find((s) => s.id === slotId)
    if (!slot) return
    const cookDay = cookNightFromCover(
      slot.coverDays,
      household.weekStartDay,
    )
    const synced = syncSlotFromPortions(
      cookDay,
      portions,
      household.peoplePerMeal,
      blockedDaySet(slotId),
    )
    setSlot(slotId, synced)
  }

  /** Coverage toggles also keep portions in step (evenings × people). */
  function toggleCoverDay(slotId: string, day: DayIndex) {
    const slot = weekPlan.slots.find((s) => s.id === slotId)
    if (!slot) return
    const has = slot.coverDays.includes(day)
    let coverDays = has
      ? slot.coverDays.filter((d) => d !== day)
      : [...slot.coverDays, day]
    if (coverDays.length === 0) {
      coverDays = [
        cookNightFromCover(slot.coverDays, household.weekStartDay),
      ]
    }
    const synced = syncSlotFromCoverDays(coverDays, household.peoplePerMeal)
    setSlot(slotId, synced)
  }

  async function onRandomise() {
    setSpinning(true)
    setRandomiseNote(null)
    await new Promise((r) => setTimeout(r, 520))
    const { errors } = randomise()
    setSpinning(false)
    if (errors.length > 0) {
      setRandomiseNote(
        `Couldn’t fill ${errors.length} meal${errors.length === 1 ? '' : 's'} under current rules.`,
      )
    }
  }

  return (
    <div className="space-y-5">
      <header className="pt-1">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-clay">
          This week
        </p>
        <h1 className="font-display text-4xl text-forest">Dinner plan</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {slots.length} meal{slots.length === 1 ? '' : 's'} · leftovers cover
          the rest
        </p>
      </header>

      <WeekStrip
        weekStartDay={household.weekStartDay}
        cooks={household.cooks}
        slots={slots}
      />

      {redMeatWarning && (
        <div className="rounded-xl border border-clay/40 bg-clay/10 px-3 py-2.5 text-sm text-ink">
          <p className="font-semibold text-clay">Red meat heads-up</p>
          <p className="mt-0.5 text-ink-muted">{redMeatWarning}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onRandomise}
        disabled={spinning}
        className="w-full rounded-2xl bg-forest py-3.5 font-display text-xl text-cream shadow-md active:scale-[0.99] disabled:opacity-70"
      >
        {spinning ? 'Shuffling…' : 'Randomise week'}
      </button>
      {randomiseNote && (
        <p className="text-center text-xs text-ink-muted">{randomiseNote}</p>
      )}

      <div className="space-y-4">
        {slots.map((slot, i) => (
          <MealCard
            key={slot.id}
            mealNumber={i + 1}
            slot={slot}
            blockedDays={blockedDaysFor(slot.id)}
            canRemove={slots.length > 1}
            recipe={recipesBySlot[slot.id]}
            spinning={spinning && !slot.locked}
            cookOptions={cookOptions}
            onToggleLock={() => setSlot(slot.id, { locked: !slot.locked })}
            onPortionsChange={(n) => changePortions(slot.id, n)}
            onToggleCoverDay={(day) => toggleCoverDay(slot.id, day)}
            onCookChange={(cookId) => setSlot(slot.id, { cookId })}
            onCarbSideChange={(carbSideId) => setSlot(slot.id, { carbSideId })}
            onRemove={() => removeMealThisWeek(slot.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => addMealThisWeek()}
        className="w-full rounded-2xl border-2 border-dashed border-line py-3 text-sm font-semibold text-forest"
      >
        + Add a meal this week
      </button>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="font-display text-xl text-forest">Coverage map</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {DAY_LABELS.map((label, day) => {
            const slot = slots.find((s) =>
              s.coverDays.includes(day as DayIndex),
            )
            const recipe = slot ? recipesBySlot[slot.id] : undefined
            return (
              <li key={label} className="flex justify-between gap-2">
                <span className="font-semibold text-ink-muted">{label}</span>
                <span className="text-right text-ink">
                  {slot && recipe
                    ? `${recipe.title} (${cookName(slot.cookId)})`
                    : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
