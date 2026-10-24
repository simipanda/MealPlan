import { DAY_LABELS } from '../data/defaultHousehold'
import type { Cook, DayIndex, MealSlot } from '../types'

interface Props {
  weekStartDay: DayIndex
  cooks: [Cook, Cook]
  slots: MealSlot[]
}

type DayRole = 'cook' | 'reheat' | 'free'

/** Week strip follows this week’s slot coverage — not Settings defaults alone. */
export function WeekStrip({ weekStartDay, cooks, slots }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = ((weekStartDay + i) % 7) as DayIndex
    const role = roleForDay(day, weekStartDay, cooks, slots)
    return { day, role }
  })

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map(({ day, role }) => (
        <div
          key={day}
          className={[
            'rounded-lg px-1 py-2 text-center text-[11px] font-semibold',
            role === 'cook'
              ? 'bg-forest text-cream'
              : role === 'reheat'
                ? 'bg-forest/15 text-forest'
                : 'bg-cream-dark/60 text-ink-muted',
          ].join(' ')}
        >
          <div>{DAY_LABELS[day]}</div>
          <div className="mt-0.5 text-[9px] font-medium opacity-80">
            {role === 'cook' ? 'Cook' : role === 'reheat' ? 'Reheat' : 'Free'}
          </div>
        </div>
      ))}
    </div>
  )
}

function weekRank(day: DayIndex, weekStartDay: DayIndex): number {
  return (day - weekStartDay + 7) % 7
}

function roleForDay(
  day: DayIndex,
  weekStartDay: DayIndex,
  cooks: [Cook, Cook],
  slots: MealSlot[],
): DayRole {
  for (const slot of slots) {
    if (!slot.coverDays.includes(day)) continue
    const cook = cooks.find((c) => c.id === slot.cookId)
    if (!cook) continue

    // Cook night = earliest covered day in the week for this slot
    // (usually the settings cook day, but follows this-week overrides).
    const cookNight = slot.coverDays.reduce((best, d) =>
      weekRank(d, weekStartDay) < weekRank(best, weekStartDay) ? d : best,
    )

    if (day === cookNight) return 'cook'
    return 'reheat'
  }
  return 'free'
}
