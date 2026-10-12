// Kleine wrapper om localStorage: alleen voor dingen die per telefoon zijn.
const PREFIX = 'omw:'

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
    /* privé-modus of vol: dan maar niet onthouden */
  }
}

export function wis(sleutel) {
  try {
    localStorage.removeItem(PREFIX + sleutel)
  } catch {
    /* niks */
  }
}
