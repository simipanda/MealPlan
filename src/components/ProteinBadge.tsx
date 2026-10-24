import { PROTEIN_LABELS } from '../data/proteinIcons'
import type { Protein } from '../types'

/** Black-on-alpha PNGs in /icons/protein — recolored via CSS mask. */
const ICON_FILE: Record<Protein, string> = {
  white: 'chicken.png',
  red: 'beef.png',
  pork: 'pork.png',
  fish: 'fish.png',
  lamb: 'lamb.png',
  veg: 'veg.png',
}

/** Badge chip + icon tint colours */
const COLOURS: Record<Protein, string> = {
  white: 'bg-[#eab308]/18 text-[#ca8a04] ring-[#eab308]/40', // chicken — yellow
  red: 'bg-[#7f1d1d]/15 text-[#7f1d1d] ring-[#7f1d1d]/30', // beef — dark red
  lamb: 'bg-[#dc2626]/12 text-[#b91c1c] ring-[#dc2626]/30', // lamb — brighter red
  fish: 'bg-[#2563eb]/12 text-[#1d4ed8] ring-[#2563eb]/30', // seafood — blue
  pork: 'bg-[#f9a8d4]/25 text-[#db2777] ring-[#ec4899]/35', // pork — pig pink
  veg: 'bg-[#3f6212]/12 text-[#3f6212] ring-[#3f6212]/25', // vegetarian — green
}

interface Props {
  protein: Protein
  size?: 'sm' | 'md'
}

function iconUrl(file: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')
  return `${base}icons/protein/${file}`
}

export function ProteinBadge({ protein, size = 'sm' }: Props) {
  const px = size === 'md' ? 20 : 16
  const url = iconUrl(ICON_FILE[protein])

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        COLOURS[protein],
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
      ].join(' ')}
    >
      <span
        className="shrink-0 bg-current"
        style={{
          width: px,
          height: px,
          WebkitMaskImage: `url(${url})`,
          maskImage: `url(${url})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
        aria-hidden
      />
      {PROTEIN_LABELS[protein]}
    </span>
  )
}
