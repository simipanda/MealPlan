import { portionMacros } from '../lib/macros'
import type { Recipe } from '../types'

type MacroRecipe = Pick<
  Recipe,
  | 'caloriesPerPortion'
  | 'proteinPerPortionG'
  | 'carbsPerPortionG'
  | 'fatPerPortionG'
  | 'carbSideOptions'
>

export function MacroPanel({
  recipe,
  carbSideId,
}: {
  recipe: MacroRecipe
  /** When set (or recipe has sides), plate macros include that side carb. */
  carbSideId?: string | null
}) {
  const macros = portionMacros(recipe, carbSideId)
  const hasAny =
    macros.caloriesPerPortion != null ||
    macros.proteinPerPortionG != null ||
    macros.carbsPerPortionG != null ||
    macros.fatPerPortionG != null

  if (!hasAny) return null

  const rows = [
    { key: 'p', label: 'Protein', value: macros.proteinPerPortionG, unit: 'g' },
    { key: 'c', label: 'Carbs', value: macros.carbsPerPortionG, unit: 'g' },
    { key: 'f', label: 'Fat', value: macros.fatPerPortionG, unit: 'g' },
  ].filter((m) => m.value != null)

  return (
    <div
      className="rounded-2xl border border-line/80 bg-card/80 px-4 py-3"
      aria-label="Approximate macros per portion"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
        Per portion
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-3">
        {macros.caloriesPerPortion != null && (
          <div>
            <p className="font-display text-3xl leading-none text-forest">
              ~{macros.caloriesPerPortion}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">kcal</p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {rows.map((m) => (
              <div key={m.key} className="min-w-[3.5rem]">
                <p className="text-lg font-bold tabular-nums text-ink">
                  {m.value}
                  <span className="ml-0.5 text-xs font-semibold text-ink-muted">
                    {m.unit}
                  </span>
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
