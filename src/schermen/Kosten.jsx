import { useEffect, useState } from 'react'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { DEELNEMERS } from '../config.js'
import { api } from '../lib/api.js'
import { Blok, Fout, Knop, Kop, Laden, Sheet, Teller, Veld } from '../ui.jsx'

const euro = (n) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })

// Saldo per persoon (in centen) en de kleinste set betalingen om alles recht te trekken.
export function verrekening(uitgaven) {
  const namen = DEELNEMERS.map((d) => d.naam)
  const centen = Object.fromEntries(namen.map((n) => [n, 0]))
  let totaal = 0
  for (const u of uitgaven) {
    const c = Math.round(u.bedrag * 100)
    centen[u.betaler] += c
    totaal += c
  }
  // Eerlijk delen; restcenten gaan naar de eersten in de lijst.
  const aandeel = Math.floor(totaal / namen.length)
  const rest = totaal - aandeel * namen.length
  const saldo = Object.fromEntries(namen.map((n, i) => [n, centen[n] - aandeel - (i < rest ? 1 : 0)]))

  const ontvangers = namen.filter((n) => saldo[n] > 0).map((n) => ({ n, c: saldo[n] }))
  const betalers = namen.filter((n) => saldo[n] < 0).map((n) => ({ n, c: -saldo[n] }))
  ontvangers.sort((a, b) => b.c - a.c)
  betalers.sort((a, b) => b.c - a.c)
  const betalingen = []
  while (ontvangers.length && betalers.length) {
    const o = ontvangers[0]
    const b = betalers[0]
    const c = Math.min(o.c, b.c)
    betalingen.push({ van: b.n, naar: o.n, bedrag: c / 100 })
    o.c -= c
    b.c -= c
    if (!o.c) ontvangers.shift()
    if (!b.c) betalers.shift()
  }
  return { totaal: totaal / 100, saldo: Object.fromEntries(namen.map((n) => [n, saldo[n] / 100])), betalingen }
}

export default function Kosten({ sessie, isOrg, terug }) {
  const [uitgaven, setUitgaven] = useState(null)
  const [fout, setFout] = useState('')
  const [nieuw, setNieuw] = useState(false)

  useEffect(() => {
    api('kosten')
      .then((r) => setUitgaven(r.uitgaven))
      .catch((e) => setFout(e.message))
  }, [])

  async function verwijder(id) {
    try {
      setUitgaven((await api('kosten', { methode: 'POST', body: { actie: 'verwijderen', id } })).uitgaven)
    } catch (e) {
      setFout(e.message)
    }
  }

  if (!uitgaven) return fout ? <Fout>{fout}</Fout> : <Laden />
  const { totaal, saldo, betalingen } = verrekening(uitgaven)
  let i = 0

  return (
    <>
      <Kop titel="Kosten" sub={`Gedeeld door ${DEELNEMERS.length}`} terug={terug} />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-rand bg-vlak p-4">
          <p className="text-sm text-tekst-zacht">Totaal</p>
          <p className="text-xl font-semibold">
            <Teller waarde={totaal} opmaak={euro} />
          </p>
        </div>
        <div className="rounded-xl border border-rand bg-vlak p-4">
          <p className="text-sm text-tekst-zacht">Per persoon</p>
          <p className="text-xl font-semibold">
            <Teller waarde={totaal / DEELNEMERS.length} opmaak={euro} />
          </p>
        </div>
      </div>

      <Knop className="mb-6 w-full" onClick={() => setNieuw(true)}>
        <Plus size={18} strokeWidth={2} /> Uitgave toevoegen
      </Knop>
      <Fout>{fout}</Fout>

      <Blok titel="Wie betaalt wie">
        {betalingen.length === 0 ? (
          <p className="px-4 py-3 text-tekst-zacht">Alles staat gelijk.</p>
        ) : (
          betalingen.map((b) => (
            <div key={b.van + b.naar} style={{ '--i': i++ }} className="opkomen flex min-h-12 items-center gap-2 border-b border-rand px-4 py-3 last:border-b-0">
              <span className="font-medium">{b.van}</span>
              <ArrowRight size={16} strokeWidth={1.75} className="text-tekst-zacht" />
              <span className="flex-1 font-medium">{b.naar}</span>
              <span className="tabular-nums">{euro(b.bedrag)}</span>
            </div>
          ))
        )}
      </Blok>

      <Blok titel="Saldo">
        {DEELNEMERS.map((d) => (
          <div key={d.naam} style={{ '--i': i++ }} className="opkomen flex min-h-12 items-center border-b border-rand px-4 py-3 last:border-b-0">
            <span className="flex-1">{d.naam}</span>
            <span className={`tabular-nums ${saldo[d.naam] < 0 ? 'text-fout' : saldo[d.naam] > 0 ? 'text-accent' : 'text-tekst-zacht'}`}>
              {saldo[d.naam] > 0 ? '+' : ''}
              {euro(saldo[d.naam])}
            </span>
          </div>
        ))}
      </Blok>

      <Blok titel="Uitgaven">
        {uitgaven.length === 0 ? (
          <p className="px-4 py-3 text-tekst-zacht">Nog geen uitgaven.</p>
        ) : (
          [...uitgaven].reverse().map((u) => {
            const mag = isOrg || u.door === sessie.naam || u.betaler === sessie.naam
            return (
              <div key={u.id} style={{ '--i': i++ }} className="opkomen flex min-h-12 items-center gap-3 border-b border-rand py-2 pr-2 pl-4 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{u.omschrijving}</p>
                  <p className="text-sm text-tekst-zacht">Betaald door {u.betaler}</p>
                </div>
                <span className="tabular-nums">{euro(u.bedrag)}</span>
                {mag && (
                  <button
                    onClick={() => verwijder(u.id)}
                    aria-label={`${u.omschrijving} verwijderen`}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-tekst-zacht active:bg-vlak-zacht"
                  >
                    <Trash2 size={18} strokeWidth={1.75} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </Blok>

      <NieuweUitgave
        open={nieuw}
        ik={sessie.naam}
        onSluit={() => setNieuw(false)}
        onKlaar={(lijst) => {
          setUitgaven(lijst)
          setNieuw(false)
        }}
      />
    </>
  )
}

function NieuweUitgave({ open, ik, onSluit, onKlaar }) {
  const [omschrijving, setOmschrijving] = useState('')
  const [bedrag, setBedrag] = useState('')
  const [betaler, setBetaler] = useState(ik)
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    if (open) {
      setOmschrijving('')
      setBedrag('')
      setBetaler(ik)
      setFout('')
    }
  }, [open, ik])

  async function opslaan(e) {
    e.preventDefault()
    setBezig(true)
    setFout('')
    try {
      const r = await api('kosten', {
        methode: 'POST',
        body: { actie: 'toevoegen', omschrijving, bedrag: Number(bedrag.replace(',', '.')), betaler },
      })
      onKlaar(r.uitgaven)
    } catch (err) {
      setFout(err.message)
    } finally {
      setBezig(false)
    }
  }

  return (
    <Sheet open={open} onSluit={onSluit} titel="Uitgave toevoegen">
      <form onSubmit={opslaan} className="space-y-3">
        <Veld label="Omschrijving" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} placeholder="Boodschappen" />
        <Veld label="Bedrag" value={bedrag} onChange={(e) => setBedrag(e.target.value)} placeholder="0,00" inputMode="decimal" />
        <div>
          <span className="mb-1 block text-sm text-tekst-zacht">Betaald door</span>
          <div className="grid grid-cols-3 gap-2">
            {DEELNEMERS.map((d) => (
              <button
                type="button"
                key={d.naam}
                onClick={() => setBetaler(d.naam)}
                className={`min-h-11 rounded-lg border text-sm font-medium transition-colors duration-150 ${
                  betaler === d.naam ? 'border-accent bg-accent-zacht text-accent' : 'border-rand'
                }`}
              >
                {d.naam}
              </button>
            ))}
          </div>
        </div>
        <Fout>{fout}</Fout>
        <Knop className="w-full" disabled={!omschrijving.trim() || !bedrag || bezig}>
          {bezig ? 'Opslaan…' : 'Opslaan'}
        </Knop>
      </form>
    </Sheet>
  )
}
