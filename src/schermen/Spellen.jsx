import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import bingo from '../data/bingo.json'
import quiz from '../data/quiz.json'
import spelers from '../data/spelers.json'
import { api } from '../lib/api.js'
import { verdien } from '../lib/badges.js'
import { klik } from '../lib/geluid.js'
import { lees, schrijf } from '../lib/opslag.js'
import { Fout, Laden, Modal, Segmenten } from '../onderdelen/Algemeen.jsx'

export default function Spellen(props) {
  const [deel, setDeel] = useState(() => lees('spellen-tab', 'gok'))
  const kies = (d) => {
    setDeel(d)
    schrijf('spellen-tab', d)
  }
  return (
    <div>
      <Segmenten
        opties={[
          ['gok', 'Gokspel'],
          ['quiz', 'Quiz'],
          ['bingo', 'Bingo'],
        ]}
        actief={deel}
        onKies={kies}
      />
      {deel === 'gok' && <Gokspel {...props} />}
      {deel === 'quiz' && <Quiz {...props} />}
      {deel === 'bingo' && <Bingo {...props} />}
    </div>
  )
}

/* ---------------- Gokspel ---------------- */

function afstandKm(a, b) {
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export function Gokspel({ naam, open, onthulling }) {
  const [stand, setStand] = useState(null)
  const [fout, setFout] = useState('')

  const laad = () => api('gokken').then(setStand).catch((e) => setFout(e.message))
  useEffect(() => {
    laad()
  }, [open])

  if (!stand) return fout ? <Fout>{fout}</Fout> : <Laden />
  if (stand.open) return <GokUitslag gokken={stand.gokken} doel={onthulling.data?.coordinaten} />

  const heeftGegokt = stand.ingeleverd.includes(naam)
  const mijnGok = lees('mijn-gok')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="kop text-3xl">Waar gaan we heen?</h1>
        <p className="text-paars-300">
          Eén gok per agent. Eenmaal ingeleverd zit hij op slot, ook voor jou. Op onthullingsdag zien we wie er het
          dichtst bij zat. Die krijgt de <b className="text-goud-licht">Dichtst-bij-prijs</b> 🏆
        </p>
      </div>

      {heeftGegokt ? (
        <div className="kaart border-goud text-center">
          <span className="stempel">Verzegeld</span>
          <p className="mt-3 text-paars-300">Jouw gok</p>
          <p className="font-kop text-2xl font-black text-goud-licht">{mijnGok?.tekst ?? '(staat veilig in de kluis)'}</p>
        </div>
      ) : (
        <GokInvoer naam={naam} onKlaar={laad} />
      )}

      <div className="kaart">
        <p className="label mb-2">Wie heeft al gegokt?</p>
        <ul className="space-y-1.5">
          {spelers.map((s) => (
            <li key={s} className="flex justify-between">
              <span>{s}</span>
              <span>{stand.ingeleverd.includes(s) ? '🔒 ingeleverd' : '⏳ twijfelt nog'}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-paars-300">Wát er gegokt is, blijft tot de onthulling in de kluis.</p>
      </div>
    </div>
  )
}

function GokInvoer({ naam, onKlaar }) {
  const [zoek, setZoek] = useState('')
  const [resultaten, setResultaten] = useState([])
  const [gekozen, setGekozen] = useState(null)
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    if (zoek.trim().length < 2) return setResultaten([])
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zoek.trim())}&count=6&language=nl&format=json`,
        )
        const data = await res.json()
        setResultaten(data.results ?? [])
      } catch {
        setResultaten([])
      }
    }, 350)
    return () => clearTimeout(t)
  }, [zoek])

  async function leverIn() {
    setBezig(true)
    setFout('')
    const gok = {
      naam,
      tekst: gekozen.name,
      land: gekozen.country ?? '',
      lat: gekozen.latitude,
      lon: gekozen.longitude,
    }
    try {
      await api('gokken', { methode: 'POST', body: gok })
      schrijf('mijn-gok', gok)
      verdien('gok')
      setGekozen(null)
      onKlaar()
    } catch (e) {
      setFout(e.message)
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="kaart space-y-3">
      <label className="block">
        <span className="label mb-2 block">Typ een plaats</span>
        <input
          className="invoer"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Bijv. Zoetermeer"
          autoComplete="off"
        />
      </label>
      {resultaten.length > 0 && (
        <ul className="divide-y divide-paars-700 overflow-hidden rounded-xl border border-paars-700">
          {resultaten.map((r) => (
            <li key={r.id}>
              <button
                className="w-full bg-paars-950 px-3 py-2.5 text-left active:bg-paars-800"
                onClick={() => setGekozen(r)}
              >
                <b>{r.name}</b>
                <span className="text-sm text-paars-300">
                  {' '}
                  · {[r.admin1, r.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Fout>{fout}</Fout>

      <Modal open={!!gekozen} onSluit={() => setGekozen(null)}>
        <p className="label">Laatste kans</p>
        <p className="mt-2 text-lg">
          Weet je het zeker? Je gok wordt <b>{gekozen?.name}</b>
          {gekozen?.country ? ` (${gekozen.country})` : ''}. Hierna kun je hem nooit meer wijzigen.
        </p>
        <div className="mt-5 flex gap-2">
          <button className="knop-stil flex-1" onClick={() => setGekozen(null)}>
            Nee, twijfel
          </button>
          <button className="knop flex-1" onClick={leverIn} disabled={bezig}>
            🔒 Verzegel
          </button>
        </div>
      </Modal>
    </div>
  )
}

export function GokUitslag({ gokken, doel }) {
  const rij = Object.entries(gokken)
    .map(([naam, g]) => ({
      naam,
      ...g,
      km: doel && g.lat != null ? Math.round(afstandKm(doel, g)) : null,
    }))
    .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
  const winnaarKm = rij[0]?.km

  return (
    <div className="space-y-3">
      <h2 className="kop text-2xl">De gokken onthuld</h2>
      {rij.length === 0 && <p className="text-paars-300">Niemand heeft gegokt. Wat een stel.</p>}
      {rij.map((g) => {
        const winnaar = g.km != null && g.km === winnaarKm
        return (
          <div key={g.naam} className={`kaart flex items-center gap-3 ${winnaar ? 'border-goud bg-paars-800' : ''}`}>
            <span className="text-3xl">{winnaar ? '🏆' : '🎯'}</span>
            <div className="flex-1">
              <p className="font-bold">{g.naam}</p>
              <p className="text-paars-300">
                {g.tekst}
                {g.land ? `, ${g.land}` : ''}
              </p>
            </div>
            {g.km != null && (
              <span className="font-kop text-lg font-black text-goud-licht">{g.km.toLocaleString('nl-NL')} km</span>
            )}
          </div>
        )
      })}
      {winnaarKm != null && (
        <p className="text-center font-typemachine text-goud-licht">
          De Dichtst-bij-prijs gaat naar {rij.filter((g) => g.km === winnaarKm).map((g) => g.naam).join(' & ')}!
        </p>
      )}
    </div>
  )
}

/* ---------------- Quiz ---------------- */

function Quiz({ naam }) {
  const [stand, setStand] = useState(null)
  const [antwoorden, setAntwoorden] = useState([])
  const [fout, setFout] = useState('')
  const vragen = quiz.vragen

  const laad = () => api('quiz').then(setStand).catch((e) => setFout(e.message))
  useEffect(() => {
    laad()
  }, [])

  async function kies(s) {
    klik()
    const nieuw = [...antwoorden, s]
    setAntwoorden(nieuw)
    if (nieuw.length === vragen.length) {
      try {
        setStand(await api('quiz', { methode: 'POST', body: { naam, antwoorden: nieuw } }))
        verdien('quiz')
      } catch (e) {
        setFout(e.message)
      }
    }
  }

  if (!stand) return fout ? <Fout>{fout}</Fout> : <Laden />

  if (!stand.ingevuld.includes(naam)) {
    const i = antwoorden.length
    if (i >= vragen.length) return <Laden />
    return (
      <div className="space-y-4">
        <div>
          <h1 className="kop text-3xl">Hoe goed ken je je vrienden?</h1>
          <p className="text-paars-300">
            15 vragen, één poging. Je scoort als je hetzelfde antwoordt als de rest van de groep.
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paars-950">
          <div className="h-full bg-goud transition-all" style={{ width: `${(i / vragen.length) * 100}%` }} />
        </div>
        <div key={i} className="kaart binnenkomen">
          <p className="label">
            Vraag {i + 1} van {vragen.length}
          </p>
          <p className="mt-2 font-kop text-2xl font-bold">{vragen[i].vraag}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {spelers.map((s) => (
              <button key={s} onClick={() => kies(s)} className="knop-stil py-3 text-base">
                {s}
              </button>
            ))}
          </div>
          {i > 0 && (
            <button className="mt-3 text-sm text-paars-300 underline" onClick={() => setAntwoorden(antwoorden.slice(0, -1))}>
              ← vorige vraag
            </button>
          )}
        </div>
        <Fout>{fout}</Fout>
      </div>
    )
  }

  const bord = Object.entries(stand.scores).sort((a, b) => b[1].score - a[1].score)
  const voorlopig = stand.ingevuld.length < spelers.length
  return (
    <div className="space-y-4">
      <h1 className="kop text-3xl">Scorebord</h1>
      <p className="text-paars-300">
        {voorlopig
          ? `Voorlopige stand: ${stand.ingevuld.length} van ${spelers.length} agenten hebben de quiz gedaan. Scores veranderen nog als de rest invult.`
          : 'Iedereen heeft gespeeld. Dit is de eindstand!'}
      </p>
      <ol className="space-y-2">
        {bord.map(([s, sc], i) => (
          <li key={s} className={`kaart flex items-center gap-3 ${s === naam ? 'border-goud' : ''}`}>
            <span className="w-8 text-center text-2xl">{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</span>
            <span className="flex-1 font-bold">{s}</span>
            <span className="font-kop text-xl font-black text-goud-licht">
              {sc.score}/{sc.max}
            </span>
          </li>
        ))}
      </ol>
      {spelers
        .filter((s) => !stand.ingevuld.includes(s))
        .map((s) => (
          <p key={s} className="text-sm text-paars-300">
            ⏳ {s} moet nog…
          </p>
        ))}
    </div>
  )
}

/* ---------------- Bingo ---------------- */

// Iedereen krijgt een eigen volgorde, maar wel steeds dezelfde (op basis van je naam).
function geschud(lijst, zaad) {
  let s = [...zaad].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  const kopie = [...lijst]
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  }
  return kopie
}

const LIJNEN = [
  ...[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((k) => r * 5 + k)),
  ...[0, 1, 2, 3, 4].map((k) => [0, 1, 2, 3, 4].map((r) => r * 5 + k)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

function Bingo({ naam }) {
  const kaart = useMemo(() => {
    const v = geschud(bingo.vakjes, naam).slice(0, 24)
    return [...v.slice(0, 12), bingo.midden, ...v.slice(12)]
  }, [naam])
  const [aan, setAan] = useState(() => new Set(lees('bingo-' + naam, [12])))

  const volleLijnen = LIJNEN.filter((l) => l.every((i) => aan.has(i))).length

  function tik(i) {
    if (i === 12) return
    const nieuw = new Set(aan)
    nieuw.has(i) ? nieuw.delete(i) : nieuw.add(i)
    const voor = LIJNEN.filter((l) => l.every((x) => aan.has(x))).length
    const na = LIJNEN.filter((l) => l.every((x) => nieuw.has(x))).length
    if (na > voor) {
      confetti({ particleCount: 120, spread: 80, colors: ['#d4a72c', '#f5d68a', '#7a1f3d', '#ffffff'] })
      verdien('bingo')
    }
    klik()
    setAan(nieuw)
    schrijf('bingo-' + naam, [...nieuw])
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="kop text-3xl">Weekend-bingo</h1>
        <p className="text-paars-300">
          Iedereen heeft een eigen kaart. Tik een vakje aan als het gebeurt. Werkt nu al, en straks tijdens de reis ook.
        </p>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {kaart.map((t, i) => (
          <button
            key={i}
            onClick={() => tik(i)}
            className={`flex aspect-square items-center justify-center rounded-lg border p-1 text-center text-[9.5px] leading-tight font-semibold transition sm:text-[11px] ${
              aan.has(i)
                ? 'border-goud bg-goud text-nacht'
                : 'border-paars-700 bg-paars-950 text-paars-300 active:bg-paars-800'
            } ${i === 12 ? 'bg-zegel! text-white! border-zegel!' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-center font-typemachine text-goud-licht">
        {volleLijnen === 0 ? 'Nog geen bingo.' : `${volleLijnen}× BINGO!`}
      </p>
      <button
        className="knop-stil w-full"
        onClick={() => {
          if (!confirm('Hele kaart leegmaken?')) return
          setAan(new Set([12]))
          schrijf('bingo-' + naam, [12])
        }}
      >
        Kaart leegmaken
      </button>
    </div>
  )
}
