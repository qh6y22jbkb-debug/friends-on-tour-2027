import { useEffect, useRef, useState } from 'react'
import { User } from 'lucide-react'
import { DEELNEMERS, TITEL } from '../config.js'
import { api } from '../lib/api.js'
import { overgang } from '../lib/overgang.js'
import { Blok, Fout, Knop, Kop, Laden, Rij, Veld } from '../ui.jsx'

export default function Login({ onIngelogd }) {
  const [naam, setNaam] = useState(null)
  const [heeftWachtwoord, setHeeftWachtwoord] = useState(null)
  const [fout, setFout] = useState('')

  async function kies(n) {
    setFout('')
    try {
      const { heeftWachtwoord } = await api('gebruiker?naam=' + encodeURIComponent(n))
      overgang(() => {
        setNaam(n)
        setHeeftWachtwoord(heeftWachtwoord)
      })
    } catch (e) {
      setFout(e.message)
    }
  }

  const terug = () => overgang(() => setNaam(null))

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(env(safe-area-inset-top),3rem)] pb-10">
      <p className="mb-1 text-sm font-medium text-accent">{TITEL}</p>
      {!naam ? (
        <>
          <Kop titel="Wie ben jij?" sub="Kies je naam om verder te gaan." />
          <Blok>
            {DEELNEMERS.map((d, i) => (
              <Rij key={d.naam} i={i} icoon={User} titel={d.naam} onClick={() => kies(d.naam)} />
            ))}
          </Blok>
          <Fout>{fout}</Fout>
        </>
      ) : heeftWachtwoord === null ? (
        <Laden />
      ) : heeftWachtwoord ? (
        <Inloggen naam={naam} terug={terug} onIngelogd={onIngelogd} />
      ) : (
        <Aanmaken naam={naam} terug={terug} onIngelogd={onIngelogd} />
      )}
    </div>
  )
}

function useSchud() {
  const [schud, setSchud] = useState(false)
  return [
    { className: schud ? 'schud' : '', onAnimationEnd: () => setSchud(false) },
    () => {
      setSchud(false)
      setTimeout(() => setSchud(true), 20)
    },
  ]
}

function Inloggen({ naam, terug, onIngelogd }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const [schudProps, schud] = useSchud()
  const veld = useRef(null)
  useEffect(() => veld.current?.focus(), [])

  async function versturen(e) {
    e.preventDefault()
    setBezig(true)
    setFout('')
    try {
      onIngelogd(await api('login', { methode: 'POST', body: { naam, wachtwoord } }))
    } catch (err) {
      setFout(err.message)
      setWachtwoord('')
      schud()
    } finally {
      setBezig(false)
    }
  }

  return (
    <form onSubmit={versturen}>
      <Kop titel={`Hoi ${naam}`} sub="Vul je wachtwoord in." terug={terug} />
      <div {...schudProps}>
        <Veld
          ref={veld}
          type="password"
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          placeholder="Wachtwoord"
          autoComplete="current-password"
        />
      </div>
      <Fout>{fout}</Fout>
      <Knop className="mt-4 w-full" disabled={!wachtwoord || bezig}>
        {bezig ? 'Bezig…' : 'Inloggen'}
      </Knop>
      <p className="mt-6 text-sm text-tekst-zacht">Wachtwoord vergeten? Vraag een organisator om het te resetten.</p>
    </form>
  )
}

function Aanmaken({ naam, terug, onIngelogd }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const [schudProps, schud] = useSchud()
  const veld = useRef(null)
  useEffect(() => veld.current?.focus(), [])

  async function versturen(e) {
    e.preventDefault()
    setFout('')
    if (wachtwoord.length < 6) return setFout('Kies een wachtwoord van minstens 6 tekens.'), schud()
    if (wachtwoord !== herhaal) return setFout('De wachtwoorden zijn niet gelijk.'), schud()
    setBezig(true)
    try {
      onIngelogd(await api('registreer', { methode: 'POST', body: { naam, wachtwoord } }))
    } catch (err) {
      setFout(err.message)
      schud()
    } finally {
      setBezig(false)
    }
  }

  return (
    <form onSubmit={versturen}>
      <Kop titel={`Welkom, ${naam}`} sub="Je bent hier voor het eerst. Maak een wachtwoord aan." terug={terug} />
      <div {...schudProps} className={`space-y-3 ${schudProps.className}`}>
        <Veld
          ref={veld}
          label="Nieuw wachtwoord"
          type="password"
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          autoComplete="new-password"
        />
        <Veld
          label="Nog een keer"
          type="password"
          value={herhaal}
          onChange={(e) => setHerhaal(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <Fout>{fout}</Fout>
      <Knop className="mt-4 w-full" disabled={!wachtwoord || !herhaal || bezig}>
        {bezig ? 'Bezig…' : 'Wachtwoord opslaan'}
      </Knop>
    </form>
  )
}
