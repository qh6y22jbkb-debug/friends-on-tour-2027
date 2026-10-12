// Kleine wrapper om localStorage. Bewaart alleen de sessie, nooit geheime inhoud.
const PREFIX = 'fot:'

export function lees(sleutel, standaard = null) {
  try {
    const v = localStorage.getItem(PREFIX + sleutel)
    return v === null ? standaard : JSON.parse(v)
  } catch {
    return standaard
  }
}

export function schrijf(sleutel, waarde) {
  try {
    localStorage.setItem(PREFIX + sleutel, JSON.stringify(waarde))
  } catch {
    /* privé-modus of vol */
  }
}

export function wis(sleutel) {
  try {
    localStorage.removeItem(PREFIX + sleutel)
  } catch {
    /* niks */
  }
}
