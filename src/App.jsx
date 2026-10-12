import { useCallback, useEffect, useRef, useState } from 'react'
import { House, CalendarDays, ListChecks, Ellipsis } from 'lucide-react'
import { api } from './lib/api.js'
import { lees, schrijf, wis } from './lib/opslag.js'
import { heeftViewTransitions, overgang } from './lib/overgang.js'
import { ONTHULLING_MS, syncTijd, useNu } from './lib/tijd.js'
import { Fout, Knop, Sheet, Veld } from './ui.jsx'
import Login from './schermen/Login.jsx'
import Start from './schermen/Start.jsx'
import Programma, { Dag } from './schermen/Programma.jsx'
import Paklijst from './schermen/Paklijst.jsx'
import Meer from './schermen/Meer.jsx'
import Bestemming from './schermen/Bestemming.jsx'
import Kosten from './schermen/Kosten.jsx'
import Organisatie from './schermen/Organisatie.jsx'
import Praktisch from './schermen/Praktisch.jsx'
import Hints from './schermen/Hints.jsx'
import Deelnemers from './schermen/Deelnemers.jsx'

const TABS = [
  ['start', 'Start', House],
  ['programma', 'Programma', CalendarDays],
  ['paklijst', 'Paklijst', ListChecks],
  ['meer', 'Meer', Ellipsis],
]

export default function App() {
  const [sessie, setSessie] = useState(() => lees('sessie'))
  const [start, setStart] = useState(null)
  const [nav, setNav] = useState({ tab: 'start', scherm: null })
  // Ontgrendelde inhoud blijft alleen in het geheugen, nooit in localStorage.
  const [ontgrendeld, setOntgrendeld] = useState({})
  const [slot, setSlot] = useState(null) // { id, titel, alleenMelding }
  const nu = useNu(1000)
  const onthuld = nu >= ONTHULLING_MS

  useEffect(() => {
    syncTijd()
    const id = setInterval(syncTijd, 10 * 60 * 1000)
    const uit = () => setSessie(null)
    window.addEventListener('fot-uitgelogd', uit)
    return () => {
      clearInterval(id)
      window.removeEventListener('fot-uitgelogd', uit)
    }
  }, [])

  useEffect(() => {
    if (!sessie) return
    api('start').then(setStart).catch(() => {})
  }, [sessie, onthuld])

  const isOrg = sessie?.rol === 'organisator'

  const ga = useCallback((wijziging) => {
    overgang(() => {
      setNav((n) => ({ ...n, ...wijziging }))
      window.scrollTo(0, 0)
    })
  }, [])

  // Haalt de inhoud van een tegel op; vraagt zo nodig eerst een wachtwoord.
  const open = useCallback(
    async (id, titel) => {
      const naarScherm = () => ga({ scherm: id.startsWith('dag-') ? { soort: 'dag', id } : { soort: id } })
      if (ontgrendeld[id]) return naarScherm()
      const zonderWachtwoord = isOrg || id === 'praktisch'
      const opTijd = id.startsWith('dag-') || onthuld || isOrg
      if (!opTijd) return setSlot({ id, titel, alleenMelding: true })
      if (!zonderWachtwoord) return setSlot({ id, titel })
      try {
        const { inhoud } = await api('tegel', { methode: 'POST', body: { id } })
        setOntgrendeld((o) => ({ ...o, [id]: inhoud }))
        naarScherm()
      } catch (e) {
        setSlot({ id, titel, alleenMelding: true, melding: e.message })
      }
    },
    [ontgrendeld, isOrg, onthuld, ga],
  )

  function uitloggen() {
    wis('sessie')
    setSessie(null)
    setStart(null)
    setOntgrendeld({})
    setNav({ tab: 'start', scherm: null })
  }

  if (!sessie) {
    return (
      <Login
        onIngelogd={(s) => {
          schrijf('sessie', s)
          overgang(() => setSessie(s))
        }}
      />
    )
  }

  const terug = () => ga({ scherm: null })
  const gedeeld = { nu, onthuld, isOrg, sessie, start, open, ontgrendeld, ga, terug }
  const s = nav.scherm

  let inhoud
  if (s?.soort === 'bestemming') inhoud = <Bestemming {...gedeeld} inhoud={ontgrendeld.bestemming} />
  else if (s?.soort === 'dag') inhoud = <Dag {...gedeeld} dag={ontgrendeld[s.id]} />
  else if (s?.soort === 'praktisch') inhoud = <Praktisch {...gedeeld} inhoud={ontgrendeld.praktisch} />
  else if (s?.soort === 'kosten') inhoud = <Kosten {...gedeeld} />
  else if (s?.soort === 'organisatie') inhoud = <Organisatie {...gedeeld} />
  else if (s?.soort === 'hints') inhoud = <Hints {...gedeeld} />
  else if (s?.soort === 'deelnemers') inhoud = <Deelnemers {...gedeeld} />
  else if (nav.tab === 'start') inhoud = <Start {...gedeeld} />
  else if (nav.tab === 'programma') inhoud = <Programma {...gedeeld} />
  else if (nav.tab === 'paklijst') inhoud = <Paklijst {...gedeeld} />
  else inhoud = <Meer {...gedeeld} onUitloggen={uitloggen} />

  const sleutel = `${nav.tab}-${s?.soort ?? ''}-${s?.id ?? ''}`

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(env(safe-area-inset-top),1.5rem)] pb-28">
      <main key={sleutel} className={heeftViewTransitions() ? '' : 'scherm-in'}>
        {inhoud}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rand bg-vlak pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md">
          {TABS.map(([id, label, Icoon]) => {
            const actief = nav.tab === id && !s
            return (
              <button
                key={id}
                onClick={() => ga({ tab: id, scherm: null })}
                aria-current={actief ? 'page' : undefined}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  nav.tab === id ? 'text-accent' : 'text-tekst-zacht'
                }`}
              >
                <Icoon size={22} strokeWidth={nav.tab === id ? 2 : 1.75} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>

      <SlotSheet
        slot={slot}
        onSluit={() => setSlot(null)}
        onOpen={(id, data) => {
          setOntgrendeld((o) => ({ ...o, [id]: data }))
          setSlot(null)
          ga({ scherm: id.startsWith('dag-') ? { soort: 'dag', id } : { soort: id } })
        }}
      />
    </div>
  )
}

function SlotSheet({ slot, onSluit, onOpen }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const [schud, setSchud] = useState(false)
  const veld = useRef(null)

  useEffect(() => {
    setWachtwoord('')
    setFout('')
    if (slot && !slot.alleenMelding) setTimeout(() => veld.current?.focus(), 350)
  }, [slot])

  async function versturen(e) {
    e.preventDefault()
    setBezig(true)
    setFout('')
    try {
      const { inhoud } = await api('tegel', { methode: 'POST', body: { id: slot.id, wachtwoord } })
      onOpen(slot.id, inhoud)
    } catch (err) {
      setFout(err.message)
      setSchud(false)
      setTimeout(() => setSchud(true), 20)
      setWachtwoord('')
    } finally {
      setBezig(false)
    }
  }

  return (
    <Sheet open={!!slot} onSluit={onSluit} titel={slot?.titel}>
      {slot?.alleenMelding ? (
        <>
          <p className="text-tekst-zacht">{slot.melding ?? 'Dit onderdeel opent op 28 april 2027 om 00:00.'}</p>
          <Knop className="mt-6 w-full" variant="rand" onClick={onSluit}>
            Sluiten
          </Knop>
        </>
      ) : (
        <form onSubmit={versturen}>
          <p className="mb-4 text-tekst-zacht">Vul het wachtwoord voor dit onderdeel in.</p>
          <div className={schud ? 'schud' : ''} onAnimationEnd={() => setSchud(false)}>
            <Veld
              ref={veld}
              type="password"
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              placeholder="Wachtwoord"
              autoComplete="off"
              autoCapitalize="none"
            />
          </div>
          <Fout>{fout}</Fout>
          <Knop className="mt-4 w-full" disabled={!wachtwoord || bezig}>
            {bezig ? 'Controleren…' : 'Openen'}
          </Knop>
        </form>
      )}
    </Sheet>
  )
}
