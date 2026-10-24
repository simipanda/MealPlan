import {
  COOK_TIME_LABELS,
  cookTimeBand,
  formatCookTime,
} from '../lib/cookTime'

interface Props {
  totalMinutes: number
  size?: 'sm' | 'md'
  /** Show Easy / Medium / Hard next to minutes. */
  showBand?: boolean
}

function ClockIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function CookTimeBadge({
  totalMinutes,
  size = 'sm',
  showBand = false,
}: Props) {
  const band = cookTimeBand(totalMinutes)
  const iconPx = size === 'md' ? 16 : 13

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full bg-cream-dark font-semibold text-ink-muted',
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
      ].join(' ')}
      title={`${COOK_TIME_LABELS[band]} · ${formatCookTime(totalMinutes)}`}
    >
      <ClockIcon size={iconPx} />
      <span>{formatCookTime(totalMinutes)}</span>
      {showBand && (
        <span className="text-ink-muted/70">· {COOK_TIME_LABELS[band]}</span>
      )}
    </span>
  )
}
