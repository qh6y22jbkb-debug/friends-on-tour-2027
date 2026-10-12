import { flushSync } from 'react-dom'

export const minderBeweging = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const heeftViewTransitions = () => typeof document.startViewTransition === 'function'

// Voert een schermwissel uit met de View Transitions API als die er is.
export function overgang(update) {
  if (!heeftViewTransitions() || minderBeweging() || document.hidden) {
    update()
    return
  }
  const t = document.startViewTransition(() => flushSync(update))
  // Een overgang die door een nieuwe wordt onderbroken is geen fout.
  t.ready.catch(() => {})
  t.finished.catch(() => {})
}
