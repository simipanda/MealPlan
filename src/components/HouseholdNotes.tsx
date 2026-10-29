interface Props {
  notes?: string
}

/** Household tweaks, shown under the ingredient list. */
export function HouseholdNotes({ notes }: Props) {
  if (!notes?.trim()) return null
  return (
    <p className="mt-3 rounded-xl bg-clay/10 px-3 py-2 text-sm leading-relaxed text-ink">
      <span className="font-semibold">Our changes. </span>
      {notes}
    </p>
  )
}
