// Opent de versleutelde kluis in de browser. Niets hiervan wordt opgeslagen:
// ontgrendelde inhoud leeft alleen in het geheugen tot je de app sluit.
import kluis from '../kluis.json'

const subtle = globalThis.crypto?.subtle
const van64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const normaal = (pw) => String(pw).trim().toLowerCase()

export const dagen = kluis.publiek.dagen
// Alleen de datums; de tekst wordt pas ontsleuteld als de datum er is.
export const hints = kluis.hints.map(({ datum }, i) => ({ datum, i }))

export async function leesHint(i) {
  controleerBrowser()
  const h = kluis.hints[i]
  const ruw = await subtle.digest('SHA-256', new TextEncoder().encode('fot-hint:' + h.datum))
  const sleutel = await subtle.importKey('raw', ruw, 'AES-GCM', false, ['decrypt'])
  return new TextDecoder().decode(await open(sleutel, h))
}

async function afgeleid(wachtwoord, salt) {
  const basis = await subtle.importKey('raw', new TextEncoder().encode(normaal(wachtwoord)), 'PBKDF2', false, ['deriveKey'])
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: van64(salt), iterations: kluis.rondes },
    basis,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
}

const open = async (sleutel, { iv, ct }) => new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: van64(iv) }, sleutel, van64(ct)))

async function leesTegel(id, ruweSleutel) {
  const sleutel = await subtle.importKey('raw', ruweSleutel, 'AES-GCM', false, ['decrypt'])
  return JSON.parse(new TextDecoder().decode(await open(sleutel, kluis.tegels[id].data)))
}

export class FoutWachtwoord extends Error {}

// Heeft deze deelnemer een eigen inlogwachtwoord?
export const heeftLogin = (naam) => Boolean(kluis.login?.[naam])

export async function controleerLogin(naam, wachtwoord) {
  controleerBrowser()
  const { salt, hash } = kluis.login[naam]
  const basis = await subtle.importKey('raw', new TextEncoder().encode(normaal(wachtwoord)), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: van64(salt), iterations: kluis.rondes }, basis, 256)
  const gegeven = btoa(String.fromCharCode(...new Uint8Array(bits)))
  if (gegeven !== hash) throw new FoutWachtwoord('Wachtwoord klopt niet.')
}

function controleerBrowser() {
  if (!subtle) throw new Error('Deze browser kan de inhoud niet openen. Gebruik een recente Safari of Chrome.')
}

// Opent één tegel met het tegelwachtwoord.
export async function ontgrendel(id, wachtwoord) {
  controleerBrowser()
  const tegel = kluis.tegels[id]
  if (!tegel?.viaWachtwoord) throw new FoutWachtwoord('Dit onderdeel opent niet met een tegelwachtwoord.')
  try {
    const ruw = await open(await afgeleid(wachtwoord, tegel.salt), tegel.viaWachtwoord)
    return leesTegel(id, ruw)
  } catch {
    throw new FoutWachtwoord('Wachtwoord klopt niet.')
  }
}

// Opent alles met het organisatorwachtwoord.
export async function ontgrendelAlles(wachtwoord) {
  controleerBrowser()
  let sleutel
  try {
    sleutel = await afgeleid(wachtwoord, kluis.org.salt)
    await open(sleutel, kluis.org.controle)
  } catch {
    throw new FoutWachtwoord('Wachtwoord klopt niet.')
  }
  const alles = {}
  for (const [id, tegel] of Object.entries(kluis.tegels)) {
    alles[id] = await leesTegel(id, await open(sleutel, tegel.viaOrg))
  }
  return alles
}
