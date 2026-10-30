import type { Recipe } from '../types'

type MacroRecipe = Pick<
  Recipe,
  | 'caloriesPerPortion'
  | 'proteinPerPortionG'
  | 'carbsPerPortionG'
  | 'fatPerPortionG'
>

export function MacroPanel({ recipe }: { recipe: MacroRecipe }) {
  const hasAny =
    recipe.caloriesPerPortion != null ||
    recipe.proteinPerPortionG != null ||
    recipe.carbsPerPortionG != null ||
    recipe.fatPerPortionG != null

  if (!hasAny) return null

  const macros = [
    { key: 'p', label: 'Protein', value: recipe.proteinPerPortionG, unit: 'g' },
    { key: 'c', label: 'Carbs', value: recipe.carbsPerPortionG, unit: 'g' },
    { key: 'f', label: 'Fat', value: recipe.fatPerPortionG, unit: 'g' },
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
        {recipe.caloriesPerPortion != null && (
          <div>
            <p className="font-display text-3xl leading-none text-forest">
              ~{recipe.caloriesPerPortion}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">kcal</p>
          </div>
        )}
        {macros.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {macros.map((m) => (
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
