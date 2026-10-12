// Operatie Mysterieweekend – de kluis.
// Deze Worker is de enige plek waar de geheime data (REVEAL_B64) leeft.
// Hij geeft die pas vrij als de SERVERtijd voorbij het onthullingsmoment is,
// of als de organisator zijn geheime code meestuurt.

import spelers from '../src/data/spelers.json'
import quiz from '../src/data/quiz.json'
import { ONTHULLING_ISO } from '../src/data/moment.js'

const ONTHULLING_MS = Date.parse(ONTHULLING_ISO)
const MAX_FOTO_BYTES = 1_500_000

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    try {
      return await api(request, env, url)
    } catch (e) {
      if (e instanceof Antwoord) return e.response
      return json({ fout: 'Er ging iets mis in de kluis.' }, 500)
    }
  },
}

class Antwoord {
  constructor(response) { this.response = response }
}
const stop = (fout, status = 400) => { throw new Antwoord(json({ fout }, status)) }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

async function sha256(tekst) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tekst))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// REVEAL_B64 = base64 van secret/reveal.json (UTF-8), geüpload als Worker-secret.
function leesGeheim(env) {
  const bytes = Uint8Array.from(atob(env.REVEAL_B64), (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function nu(env) {
  // Alleen lokaal (.dev.vars) kun je de servertijd verzetten om het slot te testen.
  if (env.DEV === '1' && env.NU_OVERRIDE) return Date.parse(env.NU_OVERRIDE)
  return Date.now()
}

async function isOrganisator(request, env) {
  const code = request.headers.get('x-org')
  if (!code || !env.ORG_HASH) return false
  return (await sha256('omw-org:' + code.trim())) === env.ORG_HASH
}

async function checkGroep(request, env) {
  if (!env.GROEP_HASH) return // geen groepscode ingesteld = open
  const code = request.headers.get('x-groep') || ''
  if ((await sha256('omw-groep:' + code.trim().toLowerCase())) !== env.GROEP_HASH) {
    stop('Onbekende agent. Toegangscode klopt niet.', 401)
  }
}

function checkNaam(naam) {
  if (!spelers.includes(naam)) stop('Die agent kennen we niet.')
  return naam
}

const tekst = (v, max) => String(v ?? '').trim().slice(0, max)

// Per vraag: telt het vaste antwoord uit quiz.json, of anders wat de meerderheid koos.
function quizScores(ingevuld) {
  const deelnemers = Object.entries(ingevuld)
  const goed = quiz.vragen.map((v, i) => {
    if (v.antwoord) return new Set([v.antwoord])
    const telling = {}
    for (const [, d] of deelnemers) telling[d.antwoorden[i]] = (telling[d.antwoorden[i]] || 0) + 1
    const hoogste = Math.max(0, ...Object.values(telling))
    return new Set(Object.keys(telling).filter((k) => telling[k] === hoogste))
  })
  const scores = {}
  for (const [naam, d] of deelnemers) {
    scores[naam] = { score: d.antwoorden.filter((a, i) => goed[i].has(a)).length, max: quiz.vragen.length }
  }
  return scores
}

async function lees(env, sleutel, standaard) {
  return (await env.DATA.get(sleutel, 'json')) ?? standaard
}
const schrijf = (env, sleutel, waarde) => env.DATA.put(sleutel, JSON.stringify(waarde))

async function api(request, env, url) {
  const pad = url.pathname.replace(/\/+$/, '')
  const methode = request.method
  const tijd = nu(env)
  const org = await isOrganisator(request, env)
  const open = tijd >= ONTHULLING_MS || org

  if (pad === '/api/tijd') return json({ nu: tijd, onthulling: ONTHULLING_MS })

  await checkGroep(request, env)
  const body = methode === 'POST' ? await request.json().catch(() => ({})) : {}

  switch (pad) {
    case '/api/aanmelden':
      return json({ ok: true, organisator: org })

    case '/api/onthulling': {
      if (!open) return json({ open: false })
      if (!env.REVEAL_B64) return json({ open: true, data: null, fout: 'Geen geheime data geüpload.' })
      return json({ open: true, preview: tijd < ONTHULLING_MS, data: leesGeheim(env) })
    }

    case '/api/gokken': {
      const gokken = await lees(env, 'gokken', {})
      if (methode === 'POST') {
        if (tijd >= ONTHULLING_MS) stop('Te laat, agent. De enveloppe is al open.')
        const naam = checkNaam(body.naam)
        if (gokken[naam]) stop('Jouw gok staat al vast. Geen gesjoemel!', 409)
        const lat = Number(body.lat), lon = Number(body.lon)
        gokken[naam] = {
          tekst: tekst(body.tekst, 80),
          land: tekst(body.land, 60),
          lat: Number.isFinite(lat) ? lat : null,
          lon: Number.isFinite(lon) ? lon : null,
          tijd,
        }
        await schrijf(env, 'gokken', gokken)
      }
      // Voor de onthulling verraden we alleen WIE er gegokt heeft, niet WAT.
      if (!open) return json({ open: false, ingeleverd: Object.keys(gokken) })
      return json({ open: true, gokken })
    }

    case '/api/kas': {
      const kas = await lees(env, 'kas', { betaald: {}, uitgaven: [] })
      if (methode === 'POST') {
        if (body.actie === 'betaald') {
          kas.betaald[checkNaam(body.naam)] = Boolean(body.waarde)
        } else if (body.actie === 'uitgave') {
          const bedrag = Math.round(Number(body.bedrag) * 100) / 100
          if (!(bedrag > 0 && bedrag < 10000)) stop('Dat bedrag klopt niet.')
          kas.uitgaven.push({
            id: crypto.randomUUID(),
            wie: checkNaam(body.wie),
            wat: tekst(body.wat, 80) || 'Iets geheims',
            bedrag,
            tijd,
          })
        } else if (body.actie === 'verwijder') {
          kas.uitgaven = kas.uitgaven.filter((u) => u.id !== body.id)
        } else stop('Onbekende actie.')
        await schrijf(env, 'kas', kas)
      }
      return json(kas)
    }

    case '/api/playlist': {
      const lijst = await lees(env, 'playlist', {})
      if (methode === 'POST') {
        const naam = checkNaam(body.naam)
        const titel = tekst(body.titel, 100)
        if (!titel) stop('Een nummer zonder titel? Knap hoor.')
        lijst[naam] = { titel, artiest: tekst(body.artiest, 100), link: tekst(body.link, 300), tijd }
        await schrijf(env, 'playlist', lijst)
      }
      return json(lijst)
    }

    case '/api/quiz': {
      const ingevuld = await lees(env, 'quiz', {})
      if (methode === 'POST') {
        const naam = checkNaam(body.naam)
        if (ingevuld[naam]) stop('Je hebt de quiz al gedaan. Eén poging, agent.', 409)
        const antwoorden = Array.isArray(body.antwoorden) ? body.antwoorden : []
        if (antwoorden.length !== quiz.vragen.length) stop('Niet alle vragen beantwoord.')
        ingevuld[naam] = { antwoorden: antwoorden.map((a) => checkNaam(a)), tijd }
        await schrijf(env, 'quiz', ingevuld)
      }
      // Losse antwoorden blijven in de kluis; we geven alleen de scores terug.
      return json({ ingevuld: Object.keys(ingevuld), scores: quizScores(ingevuld) })
    }

    // Takenlijst voor de organisatie: alleen met organisatorcode, want de taken verraden van alles.
    case '/api/regelzaken': {
      if (!org) stop('Alleen voor de organisatie.', 403)
      let taken = await lees(env, 'regelzaken', null)
      const nieuweLijst = !taken
      if (nieuweLijst) {
        const start = env.REVEAL_B64 ? leesGeheim(env).actiepunten ?? [] : []
        taken = start.map((a) => ({ id: crypto.randomUUID(), tekst: a.tekst, wanneer: a.wanneer ?? '', klaar: false }))
      }
      if (methode === 'POST') {
        if (body.actie === 'toevoegen') {
          const t = tekst(body.tekst, 200)
          if (!t) stop('Een lege taak? Die is al klaar.')
          taken.push({ id: crypto.randomUUID(), tekst: t, wanneer: tekst(body.wanneer, 40), klaar: false })
        } else if (body.actie === 'afvinken') {
          const taak = taken.find((t) => t.id === body.id)
          if (taak) {
            taak.klaar = Boolean(body.waarde)
            taak.door = taak.klaar ? tekst(body.naam, 20) : undefined
          }
        } else if (body.actie === 'verwijder') {
          taken = taken.filter((t) => t.id !== body.id)
        } else stop('Onbekende actie.')
      }
      if (methode === 'POST' || (nieuweLijst && taken.length)) await schrijf(env, 'regelzaken', taken)
      return json(taken)
    }

    case '/api/fotos': {
      if (!open) return json({ open: false, fotos: [] })
      const fotos = await lees(env, 'fotos', [])
      if (methode === 'POST') {
        const naam = checkNaam(body.naam)
        const data = String(body.data || '')
        if (!data.startsWith('data:image/jpeg;base64,')) stop('Alleen foto\'s, agent.')
        if (data.length > MAX_FOTO_BYTES) stop('Die foto is te groot.')
        const id = crypto.randomUUID()
        await env.DATA.put('foto:' + id, data)
        fotos.unshift({ id, naam, onderschrift: tekst(body.onderschrift, 120), tijd })
        await schrijf(env, 'fotos', fotos)
      }
      return json({ open: true, fotos })
    }
  }

  const fotoMatch = pad.match(/^\/api\/fotos\/([0-9a-f-]{36})$/)
  if (fotoMatch) {
    if (!open) stop('Nog even geduld.', 403)
    if (methode === 'DELETE') {
      const fotos = (await lees(env, 'fotos', [])).filter((f) => f.id !== fotoMatch[1])
      await schrijf(env, 'fotos', fotos)
      await env.DATA.delete('foto:' + fotoMatch[1])
      return json({ ok: true })
    }
    const data = await env.DATA.get('foto:' + fotoMatch[1])
    if (!data) stop('Foto niet gevonden.', 404)
    return json({ data })
  }

  return json({ fout: 'Dit pad bestaat niet. Of wel? 🕵️' }, 404)
}
