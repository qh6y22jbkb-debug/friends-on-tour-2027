// Spaarpot voor het spel: punten per persoon, op deze telefoon.
// Maximaal DAGMAX per dag te verdienen; bij PRIJS punten koop je één schatkist, daarna terug naar 0.
import { lees, schrijf } from './opslag.js'
import { datumAmsterdam, klok } from './tijd.js'

export const PRIJS = 500
export const DAGMAX = 50

const potSleutel = (naam) => 'pot-' + naam
const gekochtSleutel = (naam) => 'gekocht-' + naam

export function stand(naam) {
  const vandaag = datumAmsterdam(klok())
  const s = lees(potSleutel(naam), { bank: 0, dag: vandaag, vandaag: 0 })
  return s.dag === vandaag ? s : { ...s, dag: vandaag, vandaag: 0 }
}

// Telt punten op, maar nooit meer dan het dagmaximum. Geeft terug hoeveel er echt bij kwam.
export function verdien(naam, aantal = 1) {
  const s = stand(naam)
  const erbij = Math.max(0, Math.min(aantal, DAGMAX - s.vandaag))
  if (erbij) schrijf(potSleutel(naam), { ...s, bank: s.bank + erbij, vandaag: s.vandaag + erbij })
  return erbij
}

export const gekocht = (naam) => lees(gekochtSleutel(naam), [])

export function koopKist(naam, datum) {
  const s = stand(naam)
  if (s.bank < PRIJS || gekocht(naam).includes(datum)) return false
  schrijf(potSleutel(naam), { ...s, bank: 0 })
  schrijf(gekochtSleutel(naam), [...gekocht(naam), datum])
  return true
}

export const record = (naam) => lees('record-' + naam, 0)
export function nieuwRecord(naam, score) {
  if (score <= record(naam)) return false
  schrijf('record-' + naam, score)
  return true
}
