import { useState } from 'react'
import spelers from '../data/spelers.json'
import { api } from '../lib/api.js'
import { schrijf } from '../lib/opslag.js'
import { Fout } from '../onderdelen/Algemeen.jsx'

export default function Aanmelden({ onKlaar }) {
  const [gekozen, setGekozen] = useState(null)
  const [code, setCode] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  async function meldAan(e) {
    e.preventDefault()
    setBezig(true)
    setFout('')
    schrijf('groepscode', code.trim())
    try {
      await api('aanmelden', { methode: 'POST', body: {} })
      schrijf('naam', gekozen)
      onKlaar(gekozen)
    } catch (err) {
      setFout(err.message)
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <img src="/icoon.svg" alt="" className="binnenkomen mx-auto mb-5 h-24 w-24 rounded-3xl shadow-2xl shadow-goud/20" />
      <p className="label text-center">Strikt geheim · alleen voor ingewijden</p>
      <h1 className="mt-2 text-center font-kop text-4xl font-black text-goud-licht">Operatie Mysterieweekend</h1>
      <p className="mt-3 text-center text-paars-300">
        Welkom, agent. Identificeer jezelf. Liegen heeft geen zin: we weten toch al wie je bent.
      </p>

      <form onSubmit={meldAan} className="kaart mt-8 space-y-5">
        <div>
          <p className="label mb-2">Wie ben jij?</p>
          <div className="grid grid-cols-3 gap-2">
            {spelers.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setGekozen(s)}
                className={`rounded-xl border px-2 py-3 font-bold transition ${
                  gekozen === s ? 'border-goud bg-goud text-nacht' : 'border-paars-700 bg-paars-950 text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="label mb-2 block">Toegangscode</span>
          <input
            className="invoer"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Staat in de groepsapp"
            autoCapitalize="none"
            autoComplete="off"
          />
        </label>
        <Fout>{fout}</Fout>
        <button className="knop w-full" disabled={!gekozen || bezig}>
          {bezig ? 'Even checken…' : 'Meld je aan bij het hoofdkwartier'}
        </button>
      </form>
    </div>
  )
}
