import { useEffect, useState } from 'react'
import { ONTHULLING_ISO } from '../config.js'

export const ONTHULLING_MS = Date.parse(ONTHULLING_ISO)

// Testmodus: alleen in `npm run dev`, via VITE_TEST_TIJD in .env.local. Gaat nooit mee in de build.
const TEST = import.meta.env.DEV && import.meta.env.VITE_TEST_TIJD
const verschuiving = TEST ? Date.parse(TEST) - Date.now() : 0
const klok = () => Date.now() + verschuiving

export function useNu(interval = 1000) {
  const [nu, setNu] = useState(klok)
  useEffect(() => {
    const id = setInterval(() => setNu(klok()), interval)
    return () => clearInterval(id)
  }, [interval])
  return nu
}

export function resterend(nu) {
  const s = Math.max(0, Math.floor((ONTHULLING_MS - nu) / 1000))
  return {
    klaar: s === 0,
    dagen: Math.floor(s / 86400),
    uren: Math.floor((s % 86400) / 3600),
    minuten: Math.floor((s % 3600) / 60),
  }
}

// Datum (JJJJ-MM-DD) in Amsterdamse tijd, voor hints die per dag openen.
export function datumAmsterdam(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date(ms))
}

export function mooieDatum(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso + 'T12:00:00'),
  )
}
