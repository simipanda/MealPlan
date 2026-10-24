import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Plan', end: true },
  { to: '/recipes', label: 'Recipes' },
  { to: '/shop', label: 'Shop' },
  { to: '/settings', label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
        {links.map((link) => (
          <li key={link.to} className="flex-1">
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-semibold tracking-wide',
                  isActive ? 'text-forest' : 'text-ink-muted',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'h-1 w-8 rounded-full transition-colors',
                      isActive ? 'bg-clay' : 'bg-transparent',
                    ].join(' ')}
                  />
                  {link.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
