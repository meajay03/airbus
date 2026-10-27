import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop component:
 * Immediately resets window scroll to (0, 0) upon any route or search parameter change.
 * Avoids disruptive smooth-scroll animations and ensures pages always render starting at the top.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // Instant jump to top on navigation - no smooth scroll lag or layout fighting
    window.scrollTo(0, 0)
  }, [pathname, search])

  return null
}
