import { useEffect, useRef, useState } from 'react'
import { DEELNEMERS, TITEL } from '../config.js'
import { ontgrendelAlles } from '../lib/kluis.js'
import { overgang } from '../lib/overgang.js'
import { Blok, Fout, Knop, Kop, Rij, Rondje, Veld } from '../ui.jsx'

export default function Login({ onGekozen }) {
  const [org, setOrg] = useState(null)

  function kies(d) {
    if (d.rol === 'organisator') overgang(() => setOrg(d.naam))
    else onGekozen(d.naam)
  }

  return (
    <Scherm>
      {!org ? (
        <>
          <Kop titel="Wie ben jij?" sub="Kies je naam om verder te gaan." />
          <Blok>
            {DEELNEMERS.map((d, i) => (
              <Rij
                key={d.naam}
                i={i}
                voor={<Rondje className="font-bold">{d.naam[0]}</Rondje>}
                titel={d.naam}
                sub={d.rol === 'organisator' ? 'Organisator' : null}
                onClick={() => kies(d)}
              />
            ))}
          </Blok>
        </>
      ) : (
        <OrganisatorFormulier
          naam={org}
          terug={() => overgang(() => setOrg(null))}
          onOpen={(alles) => onGekozen(org, alles)}
        />
      )}
    </Scherm>
  )
}

// Na herladen vraagt de app een organisator opnieuw om het wachtwoord.
export function OrganisatorSlot({ naam, onOpen, onAnders }) {
  return (
    <Scherm>
      <OrganisatorFormulier naam={naam} terug={onAnders} onOpen={onOpen} />
    </Scherm>
  )
}

function Scherm({ children }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(env(safe-area-inset-top),3rem)] pb-10">
      <p className="mb-1 text-sm font-medium text-tekst-zacht">{TITEL}</p>
      {children}
    </div>
  )
}

function OrganisatorFormulier({ naam, terug, onOpen }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const [schud, setSchud] = useState(false)
  const veld = useRef(null)
  useEffect(() => veld.current?.focus(), [])

  async function versturen(e) {
    e.preventDefault()
    setBezig(true)
    setFout('')
    try {
      onOpen(await ontgrendelAlles(wachtwoord))
    } catch (err) {
      setFout(err.message)
      setWachtwoord('')
      setSchud(false)
      setTimeout(() => setSchud(true), 20)
    } finally {
      setBezig(false)
    }
  }

  return (
    <form onSubmit={versturen}>
      <Kop titel={`Hoi ${naam}`} sub="Vul het organisatorwachtwoord in. Dat opent alles." terug={terug} />
      <div className={schud ? 'schud' : ''} onAnimationEnd={() => setSchud(false)}>
        <Veld
          ref={veld}
          type="password"
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          placeholder="Organisatorwachtwoord"
          autoComplete="current-password"
        />
      </div>
      <Fout>{fout}</Fout>
      <Knop className="mt-4 w-full" disabled={!wachtwoord || bezig}>
        {bezig ? 'Openen…' : 'Openen'}
      </Knop>
    </form>
  )
}
