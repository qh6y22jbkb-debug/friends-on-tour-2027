import { useEffect, useState } from 'react'
import { ONTHULLING_ISO } from '../config.js'

export const ONTHULLING_MS = Date.parse(ONTHULLING_ISO)

// Verschil tussen serverklok en telefoonklok; de aftelklok rekent met servertijd.
let verschil = 0
const luisteraars = new Set()

export async function syncTijd() {
  try {
    const start = Date.now()
    const { nu } = await fetch('/api/tijd', { cache: 'no-store' }).then((r) => r.json())
    verschil = nu + (Date.now() - start) / 2 - Date.now()
    luisteraars.forEach((f) => f())
  } catch {
    /* offline: voorlopig de eigen klok */
  }
}

export const serverNu = () => Date.now() + verschil

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
  const s = Math.max(0, Math.floor((ONTHULLING_MS - nu) / 1000))
  return {
    klaar: s === 0,
    dagen: Math.floor(s / 86400),
    uren: Math.floor((s % 86400) / 3600),
    minuten: Math.floor((s % 3600) / 60),
  }
}

export function mooieDatum(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso + 'T12:00:00'),
  )
}
