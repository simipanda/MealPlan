import { INDULGENCE_LABELS } from '../lib/indulgence'
import type { Indulgence } from '../types'

const STYLES: Record<Indulgence, string> = {
  light: 'bg-leaf/20 text-forest',
  medium: 'bg-[#e8b84a]/25 text-[#8a6a12]',
  rich: 'bg-clay/15 text-clay',
}

export function IndulgenceBadge({
  indulgence,
  size = 'sm',
}: {
  indulgence: Indulgence
  size?: 'sm' | 'md'
}) {
  const pad = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
  return (
    <span
      className={`rounded-full font-semibold capitalize ${pad} ${STYLES[indulgence]}`}
    >
      {INDULGENCE_LABELS[indulgence]}
    </span>
  )
}
