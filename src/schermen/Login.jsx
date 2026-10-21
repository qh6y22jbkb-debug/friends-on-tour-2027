import { useEffect, useRef, useState } from 'react'
import { DEELNEMERS, TITEL } from '../config.js'
import { controleerLogin, heeftLogin, leesMissie, ontgrendelAlles } from '../lib/kluis.js'
import { overgang } from '../lib/overgang.js'
import { Avatar, Blok, Fout, Knop, Kop, Rij, Veld } from '../ui.jsx'

export default function Login({ onGekozen }) {
  const [gekozen, setGekozen] = useState(null)

  function kies(d) {
    if (d.rol === 'organisator' || heeftLogin(d.naam)) overgang(() => setGekozen(d))
    else onGekozen(d.naam)
  }
  const terug = () => overgang(() => setGekozen(null))

  return (
    <Scherm>
      {!gekozen ? (
        <>
          <Kop titel="Wie ben jij?" sub="Kies je naam om verder te gaan." />
          <Blok>
            {DEELNEMERS.map((d, i) => (
              <Rij
                key={d.naam}
                i={i}
                voor={<Avatar naam={d.naam} maat={44} />}
                titel={d.naam}
                sub={d.rol === 'organisator' ? 'Organisator' : null}
                onClick={() => kies(d)}
              />
            ))}
          </Blok>
        </>
      ) : gekozen.rol === 'organisator' ? (
        <OrganisatorFormulier naam={gekozen.naam} terug={terug} onOpen={(alles) => onGekozen(gekozen.naam, alles)} />
      ) : (
        <WachtwoordFormulier
          naam={gekozen.naam}
          terug={terug}
          uitleg="Vul je eigen wachtwoord in."
          placeholder="Wachtwoord"
          controle={async (pw) => {
            await controleerLogin(gekozen.naam, pw)
            return leesMissie(gekozen.naam, pw)
          }}
          onGoed={(missie) => onGekozen(gekozen.naam, null, missie)}
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
  return (
    <WachtwoordFormulier
      naam={naam}
      terug={terug}
      uitleg="Vul het organisatorwachtwoord in. Dat opent alles."
      placeholder="Organisatorwachtwoord"
      controle={ontgrendelAlles}
      onGoed={onOpen}
    />
  )
}

function WachtwoordFormulier({ naam, terug, uitleg, placeholder, controle, onGoed }) {
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
      onGoed(await controle(wachtwoord))
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
      <Kop titel={`Hoi ${naam}`} terug={terug} />
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Avatar naam={naam} maat={96} />
        <p className="text-tekst-zacht">{uitleg}</p>
      </div>
      <div className={schud ? 'schud' : ''} onAnimationEnd={() => setSchud(false)}>
        <Veld
          ref={veld}
          type="password"
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          placeholder={placeholder}
          autoComplete="current-password"
        />
      </div>
      <Fout>{fout}</Fout>
      <Knop className="mt-4 w-full" disabled={!wachtwoord || bezig}>
        {bezig ? 'Controleren…' : 'Inloggen'}
      </Knop>
    </form>
  )
}
