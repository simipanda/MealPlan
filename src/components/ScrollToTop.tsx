import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

function resetScroll() {
  const root = document.scrollingElement
  if (root) root.scrollTop = 0
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  window.scrollTo(0, 0)
}

/**
 * Always open a route at the top. Browsers otherwise restore the previous
 * scroll (Plan → Details lands mid-photo; Back returns mid-plan).
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    resetScroll()
    const frame = requestAnimationFrame(resetScroll)
    const later = window.setTimeout(resetScroll, 0)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(later)
    }
  }, [pathname, search])

  return null
}
