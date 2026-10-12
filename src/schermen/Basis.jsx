import { useEffect, useState } from 'react'
import extra from '../data/extra.json'
import { ACTIE_BADGES, verdiend } from '../lib/badges.js'
import { lees } from '../lib/opslag.js'
import { resterend } from '../lib/tijd.js'

export default function Basis({ nu, open, onthulling, onOpenEnveloppe }) {
  const r = resterend(nu)
  const alGeopend = lees('enveloppe-open', false)

  return (
    <div className="space-y-5">
      {open ? (
        <section className="kaart binnenkomen border-goud text-center">
          <p className="label">{onthulling.preview ? 'Preview' : 'Het is zover'}</p>
          <h2 className="kop mt-1 text-3xl">De enveloppe is vrijgegeven</h2>
          <button
            onClick={onOpenEnveloppe}
            className={`knop mt-5 w-full py-4 text-lg ${alGeopend ? '' : 'schudden'}`}
          >
            ✉️ {alGeopend ? 'Bekijk de enveloppe nog eens' : 'Open je enveloppe'}
          </button>
        </section>
      ) : (
        <Aftelklok r={r} />
      )}

      <Vertrekbord />
      <Mijlpalen dagen={open ? 0 : Math.ceil(r.ms / 86400000)} />
      <ActieBadges />
    </div>
  )
}

function Aftelklok({ r }) {
  const vakjes = [
    [r.dagen, 'dagen'],
    [r.uren, 'uren'],
    [r.minuten, 'min'],
    [r.seconden, 'sec'],
  ]
  return (
    <section className="kaart text-center">
      <span className="stempel">Top secret</span>
      <p className="mt-3 text-paars-300">De enveloppe gaat open over</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {vakjes.map(([w, l]) => (
          <div key={l} className="rounded-xl border border-goud/30 bg-paars-950 py-3">
            <div className="font-kop text-3xl font-black text-goud-licht tabular-nums sm:text-4xl">
              {String(w).padStart(l === 'dagen' ? 1 : 2, '0')}
            </div>
            <div className="font-typemachine text-[11px] tracking-widest text-paars-300 uppercase">{l}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 font-typemachine text-sm text-paars-300">28 april 2027 · 00:00 · tot die tijd: mondje dicht</p>
    </section>
  )
}

const TEKENS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?#'

// Een klapbord dat even "rammelt" en dan alsnog niks verraadt.
function Klapletters({ tekst, vertraging }) {
  const [getoond, setGetoond] = useState(() => tekst.replace(/./g, '·'))
  useEffect(() => {
    let stap = 0
    let id
    const totaal = 14
    const start = setTimeout(() => {
      id = setInterval(() => {
        stap++
        setGetoond(
          [...tekst]
            .map((c, i) =>
              c === ' ' ? ' ' : stap - i / 2 > totaal ? c : TEKENS[Math.floor(Math.random() * TEKENS.length)],
            )
            .join(''),
        )
        if (stap - tekst.length / 2 > totaal) clearInterval(id)
      }, 55)
    }, vertraging)
    return () => {
      clearTimeout(start)
      clearInterval(id)
    }
  }, [tekst, vertraging])
  return <span>{getoond}</span>
}

function Vertrekbord() {
  return (
    <section className="kaart overflow-hidden p-0">
      <div className="flex items-center justify-between bg-black px-4 py-2">
        <p className="font-typemachine text-sm tracking-widest text-goud">VERTREK · DEPARTURES</p>
        <span className="text-xs text-paars-300">onder voorbehoud</span>
      </div>
      <div className="divide-y divide-white/5 bg-[#0d0a12] font-mono text-sm">
        {extra.vertrekbord.map((v, i) => (
          <div key={i} className="grid grid-cols-[3.2rem_1fr_1.6rem] items-center gap-2 px-4 py-2.5">
            <span className="text-goud-licht">{v.tijd}</span>
            <span className="min-w-0">
              <span className="block truncate font-bold tracking-wider text-white">
                <Klapletters tekst={v.naar} vertraging={i * 200} />
              </span>
              <span className="block truncate text-[11px] text-paars-300">{v.status}</span>
            </span>
            <span className="text-center text-goud">{v.perron}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Mijlpalen({ dagen }) {
  return (
    <section className="kaart">
      <h2 className="kop text-xl">Mijlpalen</h2>
      <p className="text-sm text-paars-300">Elke mijlpaal levert een badge op. Gewoon door te wachten. Makkelijk verdiend.</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {extra.mijlpalen.map((m) => {
          const gehaald = dagen <= m.dagen
          return (
            <div
              key={m.dagen}
              title={m.tekst}
              className={`rounded-xl border p-2 text-center transition ${
                gehaald ? 'border-goud/60 bg-paars-800' : 'border-paars-700 bg-paars-950 opacity-50'
              }`}
            >
              <div className={`text-2xl ${gehaald ? '' : 'grayscale'}`}>{gehaald ? m.emoji : '🔒'}</div>
              <div className="mt-1 text-[11px] leading-tight font-semibold">{m.titel}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ActieBadges() {
  const lijst = verdiend()
  return (
    <section className="kaart">
      <h2 className="kop text-xl">Verdiende badges</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Object.entries(ACTIE_BADGES).map(([id, b]) => {
          const heb = lijst.includes(id)
          return (
            <div
              key={id}
              className={`rounded-xl border p-2 text-center ${
                heb ? 'border-goud/60 bg-paars-800' : 'border-paars-700 bg-paars-950 opacity-50'
              }`}
            >
              <div className="text-2xl">{heb ? b.emoji : '❔'}</div>
              <div className="mt-1 text-[11px] leading-tight font-semibold">{heb ? b.titel : '???'}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
