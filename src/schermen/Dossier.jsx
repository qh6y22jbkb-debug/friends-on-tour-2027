import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { lees } from '../lib/opslag.js'
import { resterend } from '../lib/tijd.js'
import { Fout, Laden, Modal } from '../onderdelen/Algemeen.jsx'
import { GokUitslag } from './Spellen.jsx'

export default function Dossier({ naam, nu, open, onthulling, onOpenEnveloppe }) {
  if (!open) {
    const r = resterend(nu)
    return (
      <div className="space-y-4 text-center">
        <div className="kaart py-10">
          <div className="text-6xl">🔐</div>
          <h1 className="kop mt-4 text-3xl">Dossier verzegeld</h1>
          <p className="mt-2 text-paars-300">
            Hier komen straks de bestemming, de tijden, de tickets, het verblijf, het programma, het échte pakadvies
            en de fotomuur. Nog {r.dagen} dagen en {r.uren} uur geduld.
          </p>
          <p className="mt-4 font-typemachine text-xs text-paars-300">
            En nee, je telefoonklok verzetten helpt niet. Mooi geprobeerd.
          </p>
        </div>
      </div>
    )
  }

  if (!lees('enveloppe-open', false)) {
    return (
      <div className="kaart py-10 text-center">
        <div className="text-6xl">✉️</div>
        <h1 className="kop mt-4 text-3xl">Eerst de enveloppe!</h1>
        <button className="knop schudden mt-6" onClick={onOpenEnveloppe}>
          Open je enveloppe
        </button>
      </div>
    )
  }

  const d = onthulling.data
  if (!d) return <Fout>{onthulling.fout || 'De geheime data ontbreekt nog op de server.'}</Fout>

  return (
    <div className="space-y-4">
      <section className="kaart border-goud text-center">
        <span className="stempel">Vrijgegeven</span>
        <h1 className="mt-3 font-kop text-4xl font-black text-goud-licht">{d.bestemming}</h1>
        {d.land && <p className="font-typemachine text-paars-300">{d.land}</p>}
        {d.slogan && <p className="mt-2">{d.slogan}</p>}
      </section>

      <Blok titel="Heenreis" emoji="🛫" velden={d.heenreis} />
      <Blok titel="Terugreis" emoji="🛬" velden={d.terugreis} />
      <Blok titel="Verblijf" emoji="🛏️" velden={d.verblijf} />

      {d.tickets?.length > 0 && (
        <section className="kaart">
          <h2 className="kop text-xl">🎟️ Tickets</h2>
          <ul className="mt-2 space-y-2">
            {d.tickets.map((t, i) => (
              <li key={i} className="rounded-xl bg-paars-950 p-3">
                <p className="font-bold">{t.naam}</p>
                {t.info && <p className="text-sm text-paars-300">{t.info}</p>}
                {t.link && <Link href={t.link}>Openen</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {d.programma?.length > 0 && <Programma dagen={d.programma} />}

      {d.pakadvies?.length > 0 && (
        <section className="kaart">
          <h2 className="kop text-xl">🧳 Het échte pakadvies</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {d.pakadvies.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {d.organisatie?.map((blok, i) => (
        <section key={i} className="kaart">
          <h2 className="kop text-xl">
            {blok.emoji} {blok.kop}
          </h2>
          <dl className="mt-2 divide-y divide-paars-700/60">
            {blok.regels.map((r, j) => (
              <div key={j} className="grid grid-cols-[6.5rem_1fr] gap-2 py-2">
                <dt className="text-sm text-paars-300">{r.label}</dt>
                <dd className="font-semibold">
                  {r.tekst}
                  {r.link && (
                    <>
                      {' '}
                      <Link href={r.link}>{r.linkTekst || 'Link'}</Link>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <GokkenBlok doel={d.coordinaten} />
      <Fotomuur naam={naam} />

      <button className="knop-stil w-full" onClick={onOpenEnveloppe}>
        ✉️ Enveloppe nog een keer openen
      </button>
    </div>
  )
}

const LABELS = {
  datum: 'Datum',
  verzamelen: 'Verzamelen',
  vertrek: 'Vertrek',
  aankomst: 'Aankomst',
  vervoer: 'Vervoer',
  naam: 'Naam',
  adres: 'Adres',
  inchecken: 'Inchecken',
  uitchecken: 'Uitchecken',
}

function Link({ href, children }) {
  if (!/^https?:\/\//.test(href)) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-bold text-goud underline">
      {children} ↗
    </a>
  )
}

function Blok({ titel, emoji, velden }) {
  if (!velden) return null
  const regels = Object.entries(velden).filter(([k, v]) => v && k !== 'link')
  return (
    <section className="kaart">
      <h2 className="kop text-xl">
        {emoji} {titel}
      </h2>
      <dl className="mt-2 space-y-1.5">
        {regels.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-2">
            <dt className="text-sm text-paars-300">{LABELS[k] ?? k}</dt>
            <dd className="font-semibold">
              {k === 'adres' ? (
                <a
                  className="underline decoration-goud/50"
                  href={`https://maps.google.com/?q=${encodeURIComponent(v)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {v}
                </a>
              ) : (
                v
              )}
            </dd>
          </div>
        ))}
      </dl>
      {velden.link && <Link href={velden.link}>Meer info</Link>}
    </section>
  )
}

// Programma per dag: tik op een dag om hem open te klappen.
function Programma({ dagen }) {
  const [open, setOpen] = useState(0)
  return (
    <section className="space-y-2">
      <h2 className="kop text-xl">🗓️ Programma</h2>
      {dagen.map((dag, i) => (
        <div key={i} className={`kaart p-0 ${open === i ? 'border-goud' : ''}`}>
          <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(open === i ? -1 : i)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paars-800 font-kop text-lg font-black text-goud-licht">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="label block">{dag.dag}</span>
              {dag.titel && <span className="block truncate font-bold">{dag.titel}</span>}
            </span>
            <span className={`text-goud transition ${open === i ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open === i && (
            <div className="binnenkomen border-t border-paars-700 px-4 pt-2 pb-4">
              <ul className="space-y-1.5">
                {dag.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-goud">→</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              {dag.notitie && (
                <p className="mt-3 rounded-lg bg-paars-950 p-3 text-sm text-paars-300">{dag.notitie}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

function GokkenBlok({ doel }) {
  const [stand, setStand] = useState(null)
  useEffect(() => {
    api('gokken').then(setStand).catch(() => {})
  }, [])
  if (!stand?.open) return null
  return (
    <section className="kaart">
      <GokUitslag gokken={stand.gokken} doel={doel} />
    </section>
  )
}

/* ---------------- Fotomuur ---------------- */

function verklein(bestand, max = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const schaal = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * schaal)
      c.height = Math.round(img.height * schaal)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(bestand)
  })
}

function Fotomuur({ naam }) {
  const [fotos, setFotos] = useState(null)
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const [groot, setGroot] = useState(null)

  const laad = () =>
    api('fotos')
      .then((r) => setFotos(r.fotos))
      .catch((e) => setFout(e.message))
  useEffect(() => {
    laad()
  }, [])

  async function upload(e) {
    const bestanden = [...e.target.files]
    e.target.value = ''
    setBezig(true)
    setFout('')
    try {
      for (const b of bestanden) {
        const data = await verklein(b)
        const r = await api('fotos', { methode: 'POST', body: { naam, data } })
        setFotos(r.fotos)
      }
    } catch (err) {
      setFout(err.message || 'Uploaden mislukt.')
    } finally {
      setBezig(false)
    }
  }

  async function verwijder(id) {
    if (!confirm('Deze foto verwijderen?')) return
    await api('fotos/' + id, { methode: 'DELETE' }).catch((e) => setFout(e.message))
    setGroot(null)
    laad()
  }

  return (
    <section className="kaart">
      <h2 className="kop text-xl">📸 Fotomuur</h2>
      <p className="text-sm text-paars-300">Bewijsmateriaal van de missie. Alleen zichtbaar voor de groep.</p>
      <label className="knop mt-3 w-full cursor-pointer">
        {bezig ? 'Uploaden…' : '＋ Foto toevoegen'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={bezig} />
      </label>
      <Fout>{fout}</Fout>
      {!fotos ? (
        <div className="mt-3">
          <Laden />
        </div>
      ) : fotos.length === 0 ? (
        <p className="mt-3 text-sm text-paars-300">Nog leeg. Iemand moet de eerste zijn.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {fotos.map((f) => (
            <Foto key={f.id} foto={f} onOpen={setGroot} />
          ))}
        </div>
      )}
      <Modal open={!!groot} onSluit={() => setGroot(null)}>
        {groot && (
          <>
            <img src={groot.data} alt={`Foto van ${groot.naam}`} className="w-full rounded-xl" />
            <p className="mt-2 text-sm text-paars-300">Door {groot.naam}</p>
            <div className="mt-3 flex gap-2">
              {groot.naam === naam && (
                <button className="knop-stil flex-1" onClick={() => verwijder(groot.id)}>
                  Verwijderen
                </button>
              )}
              <button className="knop flex-1" onClick={() => setGroot(null)}>
                Sluiten
              </button>
            </div>
          </>
        )}
      </Modal>
    </section>
  )
}

const fotoCache = new Map()

function Foto({ foto, onOpen }) {
  const [data, setData] = useState(() => fotoCache.get(foto.id))
  useEffect(() => {
    if (data) return
    api('fotos/' + foto.id)
      .then((r) => {
        fotoCache.set(foto.id, r.data)
        setData(r.data)
      })
      .catch(() => {})
  }, [foto.id, data])
  return (
    <button
      onClick={() => data && onOpen({ ...foto, data })}
      className="aspect-square overflow-hidden rounded-lg bg-paars-950"
    >
      {data ? (
        <img src={data} alt={`Foto van ${foto.naam}`} className="h-full w-full object-cover" />
      ) : (
        <span className="text-paars-300">…</span>
      )}
    </button>
  )
}
