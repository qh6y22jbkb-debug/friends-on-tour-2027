import { useEffect, useState } from 'react'
import { ONTHULLING_ISO } from '../data/moment.js'

export const ONTHULLING_MS = Date.parse(ONTHULLING_ISO)

// Verschil tussen de klok van de server en die van de telefoon.
// Zo maakt het niet uit of iemand zijn telefoonklok verzet: we rekenen met servertijd.
let verschil = 0
let gesynct = false
const luisteraars = new Set()

export async function syncTijd() {
  try {
    const start = Date.now()
    const res = await fetch('/api/tijd', { cache: 'no-store' })
    const { nu } = await res.json()
    const rtt = Date.now() - start
    verschil = nu + rtt / 2 - Date.now()
    gesynct = true
    luisteraars.forEach((f) => f())
  } catch {
    /* offline: dan voorlopig de eigen klok */
  }
}

export const serverNu = () => Date.now() + verschil
export const isGesynct = () => gesynct

export function useNu(interval = 1000) {
  const [nu, setNu] = useState(serverNu)
  useEffect(() => {
    const tik = () => setNu(serverNu())
    const id = setInterval(tik, interval)
    luisteraars.add(tik)
    return () => {
      clearInterval(id)
      luisteraars.delete(tik)
    }
  }, [interval])
  return nu
}

export function resterend(nu) {
  const ms = Math.max(0, ONTHULLING_MS - nu)
  const s = Math.floor(ms / 1000)
  return {
    ms,
    dagen: Math.floor(s / 86400),
    uren: Math.floor((s % 86400) / 3600),
    minuten: Math.floor((s % 3600) / 60),
    seconden: s % 60,
  }
}

// Datum (YYYY-MM-DD) in Amsterdamse tijd, voor hints die per dag openen.
export function datumAmsterdam(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date(ms))
}

export function mooieDatum(iso) {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso + 'T12:00:00'),
  )
}
