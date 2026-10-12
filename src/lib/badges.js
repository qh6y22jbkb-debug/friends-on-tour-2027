import { lees, schrijf } from './opslag.js'

export const ACTIE_BADGES = {
  gok: { emoji: '🔒', titel: 'Gok vastgezet', tekst: 'Je hebt je gok ingeleverd. Geen weg terug.' },
  quiz: { emoji: '🧠', titel: 'Vriendenkenner', tekst: 'Je hebt de vriendenquiz gedaan.' },
  bingo: { emoji: '🎯', titel: 'BINGO!', tekst: 'Een volle rij op je bingokaart.' },
  dj: { emoji: '🎵', titel: 'DJ van dienst', tekst: 'Je hebt een nummer toegevoegd aan de playlist.' },
  ei: { emoji: '🥚', titel: 'Paaseitje', tekst: 'Je hebt iets gevonden wat verstopt zat.' },
  speurder: { emoji: '🔎', titel: 'Hint-jager', tekst: 'Je hebt 10 hints gelezen.' },
}

export function verdiend() {
  return lees('badges', [])
}

export function verdien(id) {
  const lijst = verdiend()
  if (lijst.includes(id)) return
  schrijf('badges', [...lijst, id])
  window.dispatchEvent(new CustomEvent('omw-badge', { detail: id }))
}
