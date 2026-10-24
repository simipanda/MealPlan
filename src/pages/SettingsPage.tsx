import { useMemo, useState } from 'react'
import { DAY_FULL, DAY_LABELS } from '../data/defaultHousehold'
import { ALL_PROTEINS, PROTEIN_LABELS } from '../data/proteinIcons'
import { useApp } from '../context/AppContext'
import { overlapWarning } from '../lib/coverage'
import { newMealSlotId } from '../lib/week'
import type {
  Cook,
  CookId,
  DayIndex,
  Household,
  MealTemplate,
  Protein,
} from '../types'

export function SettingsPage() {
  const { household, setHousehold, prefs, setUnitSystem } = useApp()
  const [coverWarning, setCoverWarning] = useState<string | null>(null)

  function updateCook(index: 0 | 1, patch: Partial<Cook>) {
    const cooks = [...household.cooks] as Household['cooks']
    cooks[index] = { ...cooks[index], ...patch }
    setHousehold({ ...household, cooks })
  }

  function setTemplates(mealTemplates: MealTemplate[]) {
    setHousehold({ ...household, mealTemplates })
  }

  function updateTemplate(id: string, patch: Partial<MealTemplate>) {
    setTemplates(
      household.mealTemplates.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              id: t.id,
              coverDays: patch.coverDays ? [...patch.coverDays] : t.coverDays,
            }
          : t,
      ),
    )
  }

  function toggleTemplateDay(templateId: string, day: DayIndex) {
    const template = household.mealTemplates.find((t) => t.id === templateId)
    if (!template) return
    const has = template.coverDays.includes(day)

    if (!has) {
      const owner = household.mealTemplates.find(
        (t) => t.id !== templateId && t.coverDays.includes(day),
      )
      if (owner) {
        const cook =
          household.cooks.find((c) => c.id === owner.cookId)?.name ?? 'another meal'
        setCoverWarning(
          `${DAY_LABELS[day]} is already in another meal’s default coverage (${cook}). Each evening can only belong to one meal.`,
        )
        return
      }
    }

    let coverDays: DayIndex[]
    if (has) {
      coverDays = template.coverDays.filter((d) => d !== day)
      if (coverDays.length === 0) {
        setCoverWarning('Keep at least one default coverage day per meal.')
        return
      }
    } else {
      coverDays = [...template.coverDays, day].sort((a, b) => a - b) as DayIndex[]
    }

    setCoverWarning(null)
    updateTemplate(templateId, { coverDays })
  }

  function addMealTemplate() {
    const taken = new Set(household.mealTemplates.flatMap((t) => t.coverDays))
    let coverDay: DayIndex = household.weekStartDay
    for (let i = 0; i < 7; i++) {
      const day = ((household.weekStartDay + i) % 7) as DayIndex
      if (!taken.has(day)) {
        coverDay = day
        break
      }
    }
    const next: MealTemplate = {
      id: newMealSlotId(),
      cookId: 'cook1',
      coverDays: [coverDay],
      portions: household.peoplePerMeal,
    }
    setCoverWarning(null)
    setTemplates([...household.mealTemplates, next])
  }

  function removeMealTemplate(id: string) {
    if (household.mealTemplates.length <= 1) {
      setCoverWarning('Keep at least one meal in the weekly pattern.')
      return
    }
    setCoverWarning(null)
    setTemplates(household.mealTemplates.filter((t) => t.id !== id))
  }

  function toggleOncePerWeek(protein: Protein) {
    const has = household.oncePerWeekProteins.includes(protein)
    const oncePerWeekProteins = has
      ? household.oncePerWeekProteins.filter((p) => p !== protein)
      : [...household.oncePerWeekProteins, protein]
    setHousehold({ ...household, oncePerWeekProteins })
  }

  const asSlots = useMemo(
    () =>
      household.mealTemplates.map((t) => ({
        id: t.id,
        cookId: t.cookId,
        recipeId: null as string | null,
        locked: false,
        portions: t.portions,
        coverDays: [...t.coverDays],
      })),
    [household.mealTemplates],
  )

  const defaultOverlap = useMemo(
    () =>
      overlapWarning(asSlots, (id: CookId) => {
        return household.cooks.find((c) => c.id === id)?.name ?? id
      }),
    [asSlots, household.cooks],
  )

  const banner = coverWarning ?? defaultOverlap

  return (
    <div className="space-y-5 pb-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">
          Household
        </p>
        <h1 className="font-display text-3xl text-ink">Settings</h1>
      </header>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-3 font-display text-lg">Units</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUnitSystem('metric')}
            className={[
              'flex-1 rounded-xl py-2 text-sm font-bold',
              prefs.unitSystem === 'metric'
                ? 'bg-forest text-cream'
                : 'bg-cream-dark',
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
                : 'bg-cream-dark',
            ].join(' ')}
          >
            US cups
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-1 font-display text-lg">Once per week</h2>
        <p className="mb-3 text-xs text-ink-muted">
          Each ticked category may appear at most once per week (beef once, pork
          once, fish once, …). Chicken/veg can stay unticked if repeats are fine.
          The Plan shows a soft warning if you end up with more than one red meat.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_PROTEINS.map((protein) => {
            const on = household.oncePerWeekProteins.includes(protein)
            return (
              <button
                key={protein}
                type="button"
                onClick={() => toggleOncePerWeek(protein)}
                className={[
                  'rounded-full px-3 py-1.5 text-sm font-semibold',
                  on
                    ? 'bg-forest text-cream'
                    : 'bg-cream-dark text-ink-muted',
                ].join(' ')}
              >
                {PROTEIN_LABELS[protein]}
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-3 font-display text-lg">Week & randomise</h2>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-semibold text-ink-muted">
            Week starts on
          </span>
          <select
            className="w-full rounded-xl border border-line bg-cream px-3 py-2"
            value={household.weekStartDay}
            onChange={(e) =>
              setHousehold({
                ...household,
                weekStartDay: Number(e.target.value) as DayIndex,
              })
            }
          >
            {DAY_FULL.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-semibold text-ink-muted">
            No-repeat window (weeks)
          </span>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full rounded-xl border border-line bg-cream px-3 py-2"
            value={household.noRepeatWeeks}
            onChange={(e) =>
              setHousehold({
                ...household,
                noRepeatWeeks: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-ink-muted">
            Typical people per evening
          </span>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full rounded-xl border border-line bg-cream px-3 py-2"
            value={household.peoplePerMeal}
            onChange={(e) =>
              setHousehold({
                ...household,
                peoplePerMeal: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Used when adding a new meal template. Plan portions stay editable
            per week.
          </span>
        </label>
      </section>

      {household.cooks.map((cook, index) => (
        <section
          key={cook.id}
          className="rounded-2xl border border-line bg-card p-4"
        >
          <h2 className="mb-3 font-display text-lg">Cook {index + 1}</h2>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-ink-muted">Name</span>
            <input
              className="w-full rounded-xl border border-line bg-cream px-3 py-2"
              value={cook.name}
              onChange={(e) =>
                updateCook(index as 0 | 1, { name: e.target.value })
              }
            />
          </label>
        </section>
      ))}

      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">Meals per week</h2>
          <span className="text-xs text-ink-muted">
            {household.mealTemplates.length} default
          </span>
        </div>
        <p className="mb-3 text-xs text-ink-muted">
          How many unique meals a new week starts with. Add more for guests or
          daily cooking; leave evenings uncovered for takeaway nights. You can
          still add or remove meals on the Plan for one week only.
        </p>

        {banner && (
          <div className="mb-3 rounded-xl border border-clay/30 bg-clay/10 p-3 text-sm text-ink">
            <p className="font-semibold">Coverage conflict</p>
            <p className="mt-1 text-ink-muted">{banner}</p>
          </div>
        )}

        <div className="space-y-4">
          {household.mealTemplates.map((template, i) => (
            <div
              key={template.id}
              className="rounded-xl border border-line bg-cream/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-clay">
                  Meal {i + 1}
                </p>
                {household.mealTemplates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMealTemplate(template.id)}
                    className="text-[11px] font-semibold text-clay"
                  >
                    Remove
                  </button>
                )}
              </div>

              <label className="mb-2 block text-sm">
                <span className="mb-1 block font-semibold text-ink-muted">
                  Cook
                </span>
                <select
                  className="w-full rounded-xl border border-line bg-card px-3 py-2"
                  value={template.cookId}
                  onChange={(e) =>
                    updateTemplate(template.id, {
                      cookId: e.target.value as CookId,
                    })
                  }
                >
                  {household.cooks.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mb-2 block text-sm">
                <span className="mb-1 block font-semibold text-ink-muted">
                  Default portions
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2"
                  value={template.portions}
                  onChange={(e) =>
                    updateTemplate(template.id, {
                      portions: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </label>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Default coverage days
              </p>
              <div className="flex flex-wrap gap-1">
                {DAY_LABELS.map((label, day) => {
                  const d = day as DayIndex
                  const on = template.coverDays.includes(d)
                  const blockedBy = household.mealTemplates.find(
                    (t) =>
                      t.id !== template.id && t.coverDays.includes(d),
                  )
                  const blocked = Boolean(blockedBy) && !on
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={blocked}
                      title={
                        blocked
                          ? `Already in another meal’s coverage`
                          : undefined
                      }
                      onClick={() => toggleTemplateDay(template.id, d)}
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
          ))}
        </div>

        <button
          type="button"
          onClick={addMealTemplate}
          className="mt-3 w-full rounded-xl border-2 border-dashed border-line py-2.5 text-sm font-semibold text-forest"
        >
          + Add a meal to the weekly pattern
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-card p-4 text-sm text-ink-muted">
        <h2 className="mb-2 font-display text-lg text-ink">Install on phone</h2>
        <p>
          On Samsung Chrome: open this site → menu →{' '}
          <strong>Add to Home screen</strong> / Install app. It opens as a
          standalone MealPlan icon.
        </p>
        <p className="mt-2">
          Plan, shop ticks, and tag edits stay on this device (localStorage).
          Sync between phones can come later.
        </p>
      </section>
    </div>
  )
}
