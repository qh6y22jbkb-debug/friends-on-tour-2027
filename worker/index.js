// Friends on Tour 2027 – de server.
// Alle geheime inhoud (CONTENT_B64, HINTS_B64) leeft alleen hier. De server controleert
// naam, sessie, rol, tegelwachtwoord en servertijd voordat er iets geheims terug gaat.

import { DEELNEMERS, ONTHULLING_ISO } from '../src/config.js'
import paklijst from '../src/data/paklijst.json'

const ONTHULLING_MS = Date.parse(ONTHULLING_ISO)
const PBKDF2_RONDES = 100_000
const SESSIE_DUUR_MS = 1000 * 60 * 60 * 24 * 180
const MAX_POGINGEN = 8
const POGING_VENSTER_S = 15 * 60
const PAKLIJST_IDS = new Set(paklijst.flatMap((g) => g.items.map((i) => i.id)))

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    try {
      return await api(request, env, url)
    } catch (e) {
      if (e instanceof Stop) return e.response
      console.error(e)
      return json({ fout: 'Er ging iets mis op de server.' }, 500)
    }
  },
}

/* ---------- hulpjes ---------- */

class Stop {
  constructor(response) {
    this.response = response
  }
}
const stop = (fout, status = 400, extra = {}) => {
  throw new Stop(json({ fout, ...extra }, status))
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

const enc = new TextEncoder()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const vanB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

async function sha256(tekst) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(tekst)))
}

// Vergelijkt zonder vroeg te stoppen, zodat de duur niets verraadt.
function gelijk(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let verschil = 0
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return verschil === 0
}

async function pbkdf2(wachtwoord, saltHex) {
  const sleutel = await crypto.subtle.importKey('raw', enc.encode(wachtwoord), 'PBKDF2', false, ['deriveBits'])
  const salt = Uint8Array.from(saltHex.match(/../g), (h) => parseInt(h, 16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_RONDES }, sleutel, 256)
  return hex(bits)
}

async function hmac(env, tekst) {
  if (!env.SESSIE_GEHEIM) throw new Error('SESSIE_GEHEIM ontbreekt')
  const sleutel = await crypto.subtle.importKey('raw', enc.encode(env.SESSIE_GEHEIM), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', sleutel, enc.encode(tekst))))
}

// De sessie bevat een stukje van de salt: na een reset (nieuwe salt) zijn oude sessies ongeldig.
async function maakSessie(env, naam, salt) {
  const kern = b64url(enc.encode(JSON.stringify({ n: naam, v: salt.slice(0, 8), exp: Date.now() + SESSIE_DUUR_MS })))
  return kern + '.' + (await hmac(env, kern))
}

async function leesSessie(request, env) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '')
  const [kern, handtekening] = token.split('.')
  if (!kern || !handtekening || !gelijk(handtekening, await hmac(env, kern))) stop('Log opnieuw in.', 401)
  const { n, v, exp } = JSON.parse(new TextDecoder().decode(vanB64url(kern)))
  if (Date.now() > exp) stop('Je sessie is verlopen. Log opnieuw in.', 401)
  const persoon = DEELNEMERS.find((d) => d.naam === n)
  if (!persoon) stop('Log opnieuw in.', 401)
  // Een gereset wachtwoord maakt oude sessies ongeldig.
  const opgeslagen = await lees(env, 'gebruiker:' + n, null)
  if (!opgeslagen || opgeslagen.salt.slice(0, 8) !== v) stop('Log opnieuw in.', 401)
  return persoon
}

function geheim(env, naam) {
  if (!env[naam]) return null
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(env[naam]), (c) => c.charCodeAt(0))))
}

function nu(env) {
  // Testmodus: alleen lokaal (.dev.vars) kan de servertijd verzet worden.
  if (env.DEV === '1' && env.NU_OVERRIDE) return Date.parse(env.NU_OVERRIDE)
  return Date.now()
}

function datumAmsterdam(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date(ms))
}

async function lees(env, sleutel, standaard) {
  return (await env.DATA.get(sleutel, 'json')) ?? standaard
}
const schrijf = (env, sleutel, waarde) => env.DATA.put(sleutel, JSON.stringify(waarde))
const tekst = (v, max) => String(v ?? '').trim().slice(0, max)

// Beperkt het aantal foute pogingen per naam (inloggen en tegels apart).
async function telPoging(env, soort, naam) {
  const sleutel = `pogingen:${soort}:${naam}`
  const aantal = Number(await env.DATA.get(sleutel)) || 0
  if (aantal >= MAX_POGINGEN) stop('Te veel pogingen. Probeer het over een kwartier opnieuw.', 429)
  return {
    fout: () => env.DATA.put(sleutel, String(aantal + 1), { expirationTtl: POGING_VENSTER_S }),
    goed: () => (aantal ? env.DATA.delete(sleutel) : null),
  }
}

/* ---------- routes ---------- */

async function api(request, env, url) {
  const pad = url.pathname.replace(/\/+$/, '')
  const methode = request.method
  const tijd = nu(env)
  const onthuld = tijd >= ONTHULLING_MS
  const body = methode === 'POST' ? await request.json().catch(() => ({})) : {}

  /* --- zonder sessie --- */

  if (pad === '/api/tijd') return json({ nu: tijd, onthulling: ONTHULLING_MS })

  if (pad === '/api/gebruiker') {
    const naam = url.searchParams.get('naam')
    if (!DEELNEMERS.some((d) => d.naam === naam)) stop('Onbekende naam.', 404)
    return json({ heeftWachtwoord: Boolean(await env.DATA.get('gebruiker:' + naam)) })
  }

  if (pad === '/api/registreer' && methode === 'POST') {
    const persoon = DEELNEMERS.find((d) => d.naam === body.naam)
    if (!persoon) stop('Onbekende naam.')
    const wachtwoord = String(body.wachtwoord || '')
    if (wachtwoord.length < 6) stop('Kies een wachtwoord van minstens 6 tekens.')
    if (await env.DATA.get('gebruiker:' + persoon.naam)) stop('Voor deze naam bestaat al een wachtwoord.', 409)
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
    await schrijf(env, 'gebruiker:' + persoon.naam, { salt, hash: await pbkdf2(wachtwoord, salt) })
    return json({ token: await maakSessie(env, persoon.naam, salt), naam: persoon.naam, rol: persoon.rol })
  }

  if (pad === '/api/login' && methode === 'POST') {
    const persoon = DEELNEMERS.find((d) => d.naam === body.naam)
    if (!persoon) stop('Onbekende naam.')
    const poging = await telPoging(env, 'login', persoon.naam)
    const opgeslagen = await lees(env, 'gebruiker:' + persoon.naam, null)
    if (!opgeslagen) stop('Maak eerst een wachtwoord aan.', 409)
    if (!gelijk(await pbkdf2(String(body.wachtwoord || ''), opgeslagen.salt), opgeslagen.hash)) {
      await poging.fout()
      stop('Wachtwoord klopt niet.', 403)
    }
    await poging.goed()
    return json({ token: await maakSessie(env, persoon.naam, opgeslagen.salt), naam: persoon.naam, rol: persoon.rol })
  }

  /* --- met sessie --- */

  const ik = await leesSessie(request, env)
  const isOrg = ik.rol === 'organisator'
  const inhoud = geheim(env, 'CONTENT_B64')

  switch (pad) {
    case '/api/start': {
      // Alleen wat iedereen mag zien: datums van de dagen, geen inhoud.
      return json({
        naam: ik.naam,
        rol: ik.rol,
        onthuld,
        dagen: (inhoud?.dagen ?? []).map((d) => ({ id: d.id, datum: d.datum })),
      })
    }

    case '/api/tegel': {
      if (!inhoud) stop('De geheime inhoud is nog niet geüpload.', 503)
      const id = String(body.id || '')
      const dag = inhoud.dagen.find((d) => d.id === id)
      if (id !== 'bestemming' && id !== 'praktisch' && !dag) stop('Onbekende tegel.', 404)

      if (!isOrg) {
        if ((id === 'bestemming' || id === 'praktisch') && !onthuld) {
          stop('Opent op 28 april 2027 om 00:00.', 423)
        }
        if (id !== 'praktisch') {
          const poging = await telPoging(env, 'tegel', ik.naam)
          const verwacht = inhoud.wachtwoorden?.[id]
          const gegeven = await sha256(`fot-tegel:${id}:${String(body.wachtwoord || '').trim().toLowerCase()}`)
          if (!verwacht || !gelijk(gegeven, verwacht)) {
            await poging.fout()
            stop('Wachtwoord klopt niet.', 403)
          }
          await poging.goed()
        }
      }

      if (id === 'bestemming') return json({ inhoud: inhoud.bestemming })
      if (id === 'praktisch') return json({ inhoud: inhoud.praktisch })
      return json({ inhoud: dag })
    }

    case '/api/organisatie': {
      if (!isOrg) stop('Alleen voor organisatoren.', 403)
      if (!inhoud) stop('De geheime inhoud is nog niet geüpload.', 503)
      const status = await lees(env, 'afgevinkt', {})
      if (methode === 'POST') {
        const id = String(body.id || '')
        const bestaat = [...(inhoud.organisatie.boekingen ?? []), ...(inhoud.organisatie.actiepunten ?? [])].some((x) => x.id === id)
        if (!bestaat) stop('Onbekend punt.')
        if (body.klaar) status[id] = { door: ik.naam, tijd }
        else delete status[id]
        await schrijf(env, 'afgevinkt', status)
      }
      return json({ inhoud: inhoud.organisatie, status })
    }

    case '/api/paklijst': {
      const sleutel = 'paklijst:' + ik.naam
      let afgevinkt = await lees(env, sleutel, [])
      if (methode === 'POST') {
        const id = String(body.id || '')
        if (!PAKLIJST_IDS.has(id)) stop('Onbekend item.')
        afgevinkt = body.klaar ? [...new Set([...afgevinkt, id])] : afgevinkt.filter((x) => x !== id)
        await schrijf(env, sleutel, afgevinkt)
      }
      return json({ afgevinkt })
    }

    case '/api/kosten': {
      let uitgaven = await lees(env, 'kosten', [])
      if (methode === 'POST') {
        if (body.actie === 'toevoegen') {
          const betaler = DEELNEMERS.find((d) => d.naam === body.betaler)
          if (!betaler) stop('Kies wie er betaald heeft.')
          const bedrag = Math.round(Number(body.bedrag) * 100) / 100
          if (!(bedrag > 0 && bedrag < 100000)) stop('Vul een geldig bedrag in.')
          const omschrijving = tekst(body.omschrijving, 80)
          if (!omschrijving) stop('Vul een omschrijving in.')
          uitgaven.push({ id: crypto.randomUUID(), betaler: betaler.naam, omschrijving, bedrag, door: ik.naam, tijd })
        } else if (body.actie === 'verwijderen') {
          const uitgave = uitgaven.find((u) => u.id === body.id)
          if (!uitgave) stop('Uitgave niet gevonden.', 404)
          if (!isOrg && uitgave.door !== ik.naam && uitgave.betaler !== ik.naam) {
            stop('Alleen wie hem invoerde of een organisator kan dit verwijderen.', 403)
          }
          uitgaven = uitgaven.filter((u) => u.id !== body.id)
        } else stop('Onbekende actie.')
        await schrijf(env, 'kosten', uitgaven)
      }
      return json({ uitgaven })
    }

    case '/api/hints': {
      const hints = geheim(env, 'HINTS_B64') ?? []
      const vandaag = datumAmsterdam(tijd)
      const open = hints.filter((h) => h.datum <= vandaag)
      const volgende = hints.find((h) => h.datum > vandaag)
      return json({ open: open.reverse(), volgende: volgende?.datum ?? null, totaal: hints.length })
    }

    case '/api/deelnemers': {
      if (!isOrg) stop('Alleen voor organisatoren.', 403)
      const lijst = await Promise.all(
        DEELNEMERS.map(async (d) => ({ ...d, heeftWachtwoord: Boolean(await env.DATA.get('gebruiker:' + d.naam)) })),
      )
      return json({ deelnemers: lijst })
    }

    case '/api/reset': {
      if (!isOrg) stop('Alleen voor organisatoren.', 403)
      const doel = DEELNEMERS.find((d) => d.naam === body.naam)
      if (!doel) stop('Onbekende naam.')
      if (doel.naam === ik.naam) stop('Je kunt je eigen wachtwoord hier niet resetten.')
      await env.DATA.delete('gebruiker:' + doel.naam)
      return json({ ok: true })
    }
  }

  return json({ fout: 'Onbekend adres.' }, 404)
}
