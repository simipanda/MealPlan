import type { CarbSideOption } from '../types'

export function CarbSidePicker({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: CarbSideOption[]
  value: string | null | undefined
  onChange: (id: string) => void
  compact?: boolean
}) {
  if (!options.length) return null
  const selected = value && options.some((o) => o.id === value) ? value : options[0]!.id

  return (
    <label className={compact ? 'block' : 'block space-y-1'}>
      <span
        className={
          compact
            ? 'text-[11px] font-semibold uppercase tracking-wide text-ink-muted'
            : 'text-xs font-semibold uppercase tracking-wide text-ink-muted'
        }
      >
        Side carb
      </span>
      <select
        className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm font-semibold text-ink"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Side carb for this meal"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {!compact && (
        <p className="text-[11px] text-ink-muted">
          Adds to this week’s shop so you don’t forget.
        </p>
      )}
    </label>
  )
}
