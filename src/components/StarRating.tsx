interface Props {
  value: number | null
  onChange?: (next: number | null) => void
  size?: 'sm' | 'md'
  /** When false, stars are display-only. */
  editable?: boolean
}

const SIZE = {
  sm: 'text-sm',
  md: 'text-xl',
} as const

export function StarRating({
  value,
  onChange,
  size = 'md',
  editable = true,
}: Props) {
  const rating = value ?? 0
  const canEdit = editable && Boolean(onChange)

  return (
    <div
      className={['flex items-center gap-0.5', SIZE[size]].join(' ')}
      role={canEdit ? 'group' : 'img'}
      aria-label={rating > 0 ? `${rating} out of 5 stars` : 'No rating'}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= rating
        if (!canEdit) {
          return (
            <span
              key={n}
              className={on ? 'text-clay' : 'text-line'}
              aria-hidden
            >
              ★
            </span>
          )
        }
        return (
          <button
            key={n}
            type="button"
            className={[
              'rounded p-0.5 leading-none transition',
              on ? 'text-clay' : 'text-line hover:text-clay/60',
            ].join(' ')}
            aria-label={
              rating === n
                ? `Clear rating (${n} stars)`
                : `Rate ${n} star${n === 1 ? '' : 's'}`
            }
            aria-pressed={on}
            onClick={() => onChange?.(rating === n ? null : n)}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
