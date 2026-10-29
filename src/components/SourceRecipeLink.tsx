interface Props {
  url?: string
}

export function SourceRecipeLink({ url }: Props) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-card px-3 py-1.5 text-xs font-bold text-forest"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M14 4h6v6" />
        <path d="M10 14 20 4" />
        <path d="M20 14v6H4V4h6" />
      </svg>
      Original recipe
    </a>
  )
}
