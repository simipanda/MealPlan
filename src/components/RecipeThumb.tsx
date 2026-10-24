import { useState } from 'react'
import { PROTEIN_PLACEHOLDER } from '../data/proteinIcons'
import type { Protein } from '../types'

interface Props {
  title: string
  protein: Protein
  image?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'aspect-[4/3] w-full',
} as const

function resolveImageUrl(image: string): string {
  if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')
  const path = image.replace(/^\//, '')
  return `${base}${path}`
}

export function RecipeThumb({
  title,
  protein,
  image,
  className = '',
  size = 'sm',
}: Props) {
  const [failed, setFailed] = useState(false)
  const colour = PROTEIN_PLACEHOLDER[protein]
  const showImage = Boolean(image) && !failed

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden rounded-xl',
        SIZE_CLASS[size],
        className,
      ].join(' ')}
      aria-hidden
    >
      {showImage ? (
        <img
          src={resolveImageUrl(image!)}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-end p-1.5"
          style={{
            background: `linear-gradient(145deg, ${colour}44 0%, ${colour}aa 100%)`,
          }}
        >
          <span className="line-clamp-2 text-[9px] font-bold leading-tight text-white drop-shadow-sm">
            {title}
          </span>
        </div>
      )}
    </div>
  )
}
