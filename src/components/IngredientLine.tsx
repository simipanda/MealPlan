import { formatAmountLine, formatIngredientAmount } from '../lib/units'
import type { Ingredient, UnitSystem } from '../types'

interface Props {
  ingredient: Ingredient
  basePortions: number
  targetPortions: number
  unitSystem: UnitSystem
  large?: boolean
}

export function IngredientLine({
  ingredient,
  basePortions,
  targetPortions,
  unitSystem,
  large,
}: Props) {
  const formatted = formatIngredientAmount(
    ingredient,
    basePortions,
    targetPortions,
    unitSystem,
  )
  return (
    <li
      className={[
        'flex items-baseline justify-between gap-3 border-b border-line/50 py-2',
        large ? 'text-lg' : 'text-sm',
      ].join(' ')}
    >
      <span className="font-medium text-ink">{ingredient.name}</span>
      <span className="shrink-0 text-ink-muted tabular-nums">
        {formatAmountLine(formatted)}
      </span>
    </li>
  )
}
