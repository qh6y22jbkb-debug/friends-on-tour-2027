import { useEffect, useState } from 'react'
import extra from '../data/extra.json'
import spelers from '../data/spelers.json'
import { api } from '../lib/api.js'
import { verdien } from '../lib/badges.js'
import { lees, schrijf } from '../lib/opslag.js'
import { Fout, Laden, Segmenten } from '../onderdelen/Algemeen.jsx'

const INLEG = 500
const euro = (n) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })

export default function Groep(props) {
  const [deel, setDeel] = useState(() => lees('groep-tab', 'kas'))
  const kies = (d) => {
    setDeel(d)
    schrijf('groep-tab', d)
  }
  return (
    <div>
      <Segmenten
        opties={[
          ['kas', 'Kas'],
          ['playlist', 'Playlist'],
          ['paklijst', 'Paklijst'],
        ]}
        actief={deel}
        onKies={kies}
      />
      {deel === 'kas' && <Kas {...props} />}
      {deel === 'playlist' && <Playlist {...props} />}
      {deel === 'paklijst' && <Paklijst {...props} />}
    </div>
  )
}

/* ---------------- Kas ---------------- */

function Kas({ naam }) {
  const [kas, setKas] = useState(null)
  const [fout, setFout] = useState('')
  const [wat, setWat] = useState('')
  const [bedrag, setBedrag] = useState('')

  useEffect(() => {
    api('kas').then(setKas).catch((e) => setFout(e.message))
  }, [])

  async function actie(body) {
    setFout('')
    try {
      setKas(await api('kas', { methode: 'POST', body }))
      return true
    } catch (e) {
      setFout(e.message)
      return false
    }
  }

  async function voegToe(e) {
    e.preventDefault()
    const ok = await actie({ actie: 'uitgave', wie: naam, wat, bedrag: Number(bedrag.replace(',', '.')) })
    if (ok) {
      setWat('')
      setBedrag('')
    }
  }

  if (!kas) return fout ? <Fout>{fout}</Fout> : <Laden />

  const aantalBetaald = spelers.filter((s) => kas.betaald[s]).length
  const ingelegd = aantalBetaald * INLEG
  const uitgegeven = kas.uitgaven.reduce((t, u) => t + u.bedrag, 0)
  const doel = spelers.length * INLEG

  return (
    <div className="space-y-4">
      <div>
        <h1 className="kop text-3xl">De pot</h1>
        <p className="text-paars-300">{euro(INLEG)} per agent. Geen smoesjes, geen IOU-briefjes.</p>
      </div>

      <div className="kaart">
        <div className="grid grid-cols-3 text-center">
          <div>
            <p className="label">In de pot</p>
            <p className="font-kop text-xl font-black text-goud-licht">{euro(ingelegd)}</p>
          </div>
          <div>
            <p className="label">Uitgegeven</p>
            <p className="font-kop text-xl font-black">{euro(uitgegeven)}</p>
          </div>
          <div>
            <p className="label">Over</p>
            <p className={`font-kop text-xl font-black ${ingelegd - uitgegeven < 0 ? 'text-red-400' : 'text-goud-licht'}`}>
              {euro(ingelegd - uitgegeven)}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-paars-950">
          <div className="h-full bg-goud" style={{ width: `${(ingelegd / doel) * 100}%` }} />
        </div>
        <p className="mt-1 text-center text-xs text-paars-300">
          {aantalBetaald} van {spelers.length} betaald · doel {euro(doel)}
        </p>
      </div>

      <div className="kaart">
        <p className="label mb-2">Wie heeft betaald?</p>
        <ul className="space-y-2">
          {spelers.map((s) => (
            <li key={s} className="flex items-center justify-between">
              <span className="font-semibold">{s}</span>
              <button
                onClick={() => actie({ actie: 'betaald', naam: s, waarde: !kas.betaald[s] })}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                  kas.betaald[s] ? 'bg-goud text-nacht' : 'border border-zegel text-pink-200'
                }`}
              >
                {kas.betaald[s] ? '✅ Betaald' : '💸 Nog niet'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={voegToe} className="kaart space-y-2">
        <p className="label">Uitgave toevoegen</p>
        <input className="invoer" value={wat} onChange={(e) => setWat(e.target.value)} placeholder="Waaraan? (bijv. snacks)" />
        <div className="flex gap-2">
          <input
            className="invoer"
            value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
            placeholder="€ 0,00"
            inputMode="decimal"
          />
          <button className="knop shrink-0" disabled={!bedrag}>
            Toevoegen
          </button>
        </div>
      </form>
      <Fout>{fout}</Fout>

      <div className="kaart">
        <p className="label mb-2">Uitgaven</p>
        {kas.uitgaven.length === 0 && <p className="text-sm text-paars-300">Nog niks uitgegeven. Verdacht zuinig.</p>}
        <ul className="divide-y divide-paars-700">
          {[...kas.uitgaven].reverse().map((u) => (
            <li key={u.id} className="flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.wat}</p>
                <p className="text-xs text-paars-300">door {u.wie}</p>
              </div>
              <span className="font-bold">{euro(u.bedrag)}</span>
              <button
                aria-label="Verwijder uitgave"
                className="px-2 text-paars-300"
                onClick={() => confirm(`"${u.wat}" verwijderen?`) && actie({ actie: 'verwijder', id: u.id })}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ---------------- Playlist ---------------- */

function Playlist({ naam }) {
  const [lijst, setLijst] = useState(null)
  const [fout, setFout] = useState('')
  const [titel, setTitel] = useState('')
  const [artiest, setArtiest] = useState('')
  const [link, setLink] = useState('')
  const [bewerken, setBewerken] = useState(false)

  useEffect(() => {
    api('playlist').then(setLijst).catch((e) => setFout(e.message))
  }, [])

  async function opslaan(e) {
    e.preventDefault()
    setFout('')
    try {
      setLijst(await api('playlist', { methode: 'POST', body: { naam, titel, artiest, link } }))
      verdien('dj')
      setBewerken(false)
    } catch (err) {
      setFout(err.message)
    }
  }

  if (!lijst) return fout ? <Fout>{fout}</Fout> : <Laden />
  const mijn = lijst[naam]
  const toonFormulier = !mijn || bewerken

  return (
    <div className="space-y-4">
      <div>
        <h1 className="kop text-3xl">Heenreis-playlist</h1>
        <p className="text-paars-300">Iedere agent mag precies één nummer kiezen. Kies wijs: de groep oordeelt.</p>
      </div>

      {toonFormulier ? (
        <form onSubmit={opslaan} className="kaart space-y-2">
          <p className="label">{mijn ? 'Jouw nummer wijzigen' : 'Jouw nummer'}</p>
          <input className="invoer" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Titel" />
          <input className="invoer" value={artiest} onChange={(e) => setArtiest(e.target.value)} placeholder="Artiest" />
          <input
            className="invoer"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optioneel, bijv. Spotify)"
            inputMode="url"
          />
          <Fout>{fout}</Fout>
          <button className="knop w-full" disabled={!titel.trim()}>
            🎵 Zet op de lijst
          </button>
        </form>
      ) : (
        <button
          className="knop-stil w-full"
          onClick={() => {
            setTitel(mijn.titel)
            setArtiest(mijn.artiest)
            setLink(mijn.link)
            setBewerken(true)
          }}
        >
          Spijt? Wijzig je nummer
        </button>
      )}

      <ol className="space-y-2">
        {spelers.map((s, i) => {
          const n = lijst[s]
          const zoek = n && `https://open.spotify.com/search/${encodeURIComponent(`${n.titel} ${n.artiest}`)}`
          return (
            <li key={s} className="kaart flex items-center gap-3">
              <span className="font-kop text-2xl font-black text-goud/60">{i + 1}</span>
              <div className="min-w-0 flex-1">
                {n ? (
                  <>
                    <p className="truncate font-bold">{n.titel}</p>
                    <p className="truncate text-sm text-paars-300">
                      {n.artiest || 'onbekende artiest'} · gekozen door {s}
                    </p>
                  </>
                ) : (
                  <p className="text-paars-300">{s} moet nog kiezen…</p>
                )}
              </div>
              {n && (
                <a
                  href={/^https?:\/\//.test(n.link) ? n.link : zoek}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-goud px-3 py-1.5 text-sm font-bold text-nacht"
                >
                  ▶
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------------- Paklijst ---------------- */

function Paklijst({ naam }) {
  const sleutel = 'paklijst-' + naam
  const [vink, setVink] = useState(() => new Set(lees(sleutel, [])))
  function wissel(i) {
    const n = new Set(vink)
    n.has(i) ? n.delete(i) : n.add(i)
    setVink(n)
    schrijf(sleutel, [...n])
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="kop text-3xl">Paklijst</h1>
        <p className="text-paars-300">
          Het officiële, volledig nietszeggende pakadvies. Het echte advies zit in de enveloppe.
        </p>
      </div>
      <ul className="kaart divide-y divide-paars-700 p-0">
        {extra.paklijst.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
              <input type="checkbox" checked={vink.has(i)} onChange={() => wissel(i)} className="h-5 w-5 accent-[#d4a72c]" />
              <span className={vink.has(i) ? 'text-paars-300 line-through' : ''}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-center font-typemachine text-sm text-paars-300">
        {vink.size}/{extra.paklijst.length} ingepakt
      </p>
    </div>
  )
}
