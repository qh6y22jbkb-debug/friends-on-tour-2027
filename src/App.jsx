import { useCallback, useEffect, useRef, useState } from 'react'
import { House, CalendarDays, ListChecks, Ellipsis } from 'lucide-react'
import { DEELNEMERS } from './config.js'
import { dagen, eerstNodig, ontgrendel } from './lib/kluis.js'
import { lees, schrijf, wis } from './lib/opslag.js'
import { heeftViewTransitions, overgang } from './lib/overgang.js'
import { ONTHULLING_MS, useNu } from './lib/tijd.js'
import { Fout, Knop, Sheet, Veld } from './ui.jsx'
import Login, { OrganisatorSlot } from './schermen/Login.jsx'
import Start from './schermen/Start.jsx'
import Programma, { Dag } from './schermen/Programma.jsx'
import Paklijst from './schermen/Paklijst.jsx'
import Meer from './schermen/Meer.jsx'
import Bestemming from './schermen/Bestemming.jsx'
import Organisatie from './schermen/Organisatie.jsx'
import Praktisch from './schermen/Praktisch.jsx'
import Hints from './schermen/Hints.jsx'

const TABS = [
  ['start', 'Start', House],
  ['programma', 'Programma', CalendarDays],
  ['paklijst', 'Paklijst', ListChecks],
  ['meer', 'Meer', Ellipsis],
]

// Bestemming en Praktisch openen met hetzelfde wachtwoord.
const SAMEN = { bestemming: 'praktisch', praktisch: 'bestemming' }

export default function App() {
  const [naam, setNaam] = useState(() => lees('naam'))
  const persoon = DEELNEMERS.find((d) => d.naam === naam)
  const isOrg = persoon?.rol === 'organisator'
  const [nav, setNav] = useState({ tab: 'start', scherm: null })
  // Ontgrendelde inhoud blijft alleen in het geheugen.
  const [ontgrendeld, setOntgrendeld] = useState({})
  const [slot, setSlot] = useState(null) // { id, titel, daarna }
  const [missie, setMissie] = useState(null)
  // Het bestemmingswachtwoord is nodig om een dag te openen; alleen in het geheugen.
  const bestemmingPw = useRef(null)
  const nu = useNu(1000)
  const onthuld = nu >= ONTHULLING_MS

  const ga = useCallback((wijziging) => {
    overgang(() => {
      setNav((n) => ({ ...n, ...wijziging }))
      window.scrollTo(0, 0)
    })
  }, [])

  const naarTegel = useCallback(
    (id) => ga({ scherm: id.startsWith('dag-') ? { soort: 'dag', id } : { soort: id } }),
    [ga],
  )

  const open = useCallback(
    (id, titel) => {
      if (ontgrendeld[id]) return naarTegel(id)
      // Een dag kan pas als de bestemming open is: eerst dat wachtwoord, dan het dagwachtwoord.
      if (eerstNodig(id) && !bestemmingPw.current) return setSlot({ id: 'bestemming', titel: 'Eerst de bestemming', daarna: { id, titel } })
      setSlot({ id, titel })
    },
    [ontgrendeld, naarTegel],
  )

  function uitloggen() {
    wis('naam')
    bestemmingPw.current = null
    setNaam(null)
    setOntgrendeld({})
    setNav({ tab: 'start', scherm: null })
  }

  if (!persoon) {
    return (
      <Login
        onGekozen={(n, alles, eigenMissie) => {
          schrijf('naam', n)
          if (eigenMissie) schrijf('missie-' + n, eigenMissie)
          overgang(() => {
            setNaam(n)
            if (alles) setOntgrendeld(alles)
          })
          if (eigenMissie) setTimeout(() => setMissie(eigenMissie), 500)
        }}
      />
    )
  }

  // Organisator na herladen: eerst opnieuw het organisatorwachtwoord.
  if (isOrg && !ontgrendeld.organisatie) {
    return <OrganisatorSlot naam={naam} onOpen={(alles) => overgang(() => setOntgrendeld(alles))} onAnders={uitloggen} />
  }

  const terug = () => ga({ scherm: null })
  const gedeeld = { nu, onthuld, isOrg, naam, dagen, open, ontgrendeld, ga, terug }
  const s = nav.scherm

  let inhoud
  if (s?.soort === 'bestemming') inhoud = <Bestemming {...gedeeld} inhoud={ontgrendeld.bestemming} />
  else if (s?.soort === 'dag') inhoud = <Dag {...gedeeld} dag={ontgrendeld[s.id]} />
  else if (s?.soort === 'praktisch') inhoud = <Praktisch {...gedeeld} inhoud={ontgrendeld.praktisch} />
  else if (s?.soort === 'organisatie') inhoud = <Organisatie {...gedeeld} inhoud={ontgrendeld.organisatie} missies={ontgrendeld.missies} />
  else if (s?.soort === 'hints') inhoud = <Hints {...gedeeld} />
  else if (nav.tab === 'start') inhoud = <Start {...gedeeld} />
  else if (nav.tab === 'programma') inhoud = <Programma {...gedeeld} />
  else if (nav.tab === 'paklijst') inhoud = <Paklijst {...gedeeld} />
  else inhoud = <Meer {...gedeeld} onUitloggen={uitloggen} onMissie={() => setMissie(lees('missie-' + naam))} />

  const sleutel = `${nav.tab}-${s?.soort ?? ''}-${s?.id ?? ''}`

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-32">
      <main key={sleutel} className={heeftViewTransitions() ? '' : 'scherm-in'}>
        {inhoud}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] bg-vlak pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-md px-2">
          {TABS.map(([id, label, Icoon]) => {
            const actief = nav.tab === id
            return (
              <button
                key={id}
                onClick={() => ga({ tab: id, scherm: null })}
                aria-current={actief && !s ? 'page' : undefined}
                className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs ${
                  actief ? 'font-bold text-tekst' : 'font-medium text-tekst-zacht'
                }`}
              >
                <span className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200 ${actief ? 'bg-accent text-op-accent' : ''}`}>
                  <Icoon size={20} strokeWidth={actief ? 2.25 : 1.75} />
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </nav>

      <MissiePopup missie={missie} onSluit={() => setMissie(null)} />

      <SlotSheet
        slot={slot}
        ontgrendeld={ontgrendeld}
        bestemmingPw={bestemmingPw}
        onVervolg={(volgende, extra) => {
          setOntgrendeld((o) => ({ ...o, ...extra }))
          setSlot(volgende)
        }}
        onErbij={(extra) => setOntgrendeld((o) => ({ ...o, ...extra }))}
        onSluit={() => setSlot(null)}
        onOpen={(id, extra) => {
          setOntgrendeld((o) => ({ ...o, ...extra }))
          setSlot(null)
          naarTegel(id)
        }}
      />
    </div>
  )
}

function SlotSheet({ slot, ontgrendeld, bestemmingPw, onSluit, onOpen, onVervolg, onErbij }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const [schud, setSchud] = useState(false)
  const veld = useRef(null)

  useEffect(() => {
    setWachtwoord('')
    setFout('')
    if (slot) setTimeout(() => veld.current?.focus(), 350)
  }, [slot])

  async function versturen(e) {
    e.preventDefault()
    setBezig(true)
    setFout('')
    try {
      const extra = { [slot.id]: await ontgrendel(slot.id, wachtwoord, bestemmingPw.current) }
      const partner = SAMEN[slot.id]
      if (partner) {
        extra[partner] = await ontgrendel(partner, wachtwoord)
        bestemmingPw.current = wachtwoord
      }
      if (slot.daarna) {
        onVervolg(slot.daarna, extra)
        return
      }
      onOpen(slot.id, extra)
      // Dagen met hetzelfde wachtwoord gaan meteen mee open (op de achtergrond).
      if (slot.id.startsWith('dag-')) {
        const pw = wachtwoord
        for (const d of dagen) {
          if (d.id === slot.id || ontgrendeld[d.id]) continue
          ontgrendel(d.id, pw, bestemmingPw.current).then((inhoud) => onErbij({ [d.id]: inhoud }), () => {})
        }
      }
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
      <form onSubmit={versturen}>
        <p className="mb-4 text-tekst-zacht">
          {slot?.daarna
            ? 'Een dag openen kan pas als de bestemming open is. Vul eerst het wachtwoord van de bestemming in.'
            : slot?.id.startsWith('dag-')
              ? 'Vul het wachtwoord voor deze dag in.'
              : 'Vul het wachtwoord voor dit onderdeel in.'}
        </p>
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
          {bezig ? 'Openen…' : 'Openen'}
        </Knop>
      </form>
    </Sheet>
  )
}

// Pop-up met de geheime missie, direct na het inloggen (en later via Meer).
function MissiePopup({ missie, onSluit }) {
  return (
    <Sheet open={!!missie} onSluit={onSluit} titel="Je geheime missie">
      {missie && (
        <>
          <div className="mb-4 rounded-[24px] bg-accent p-5 text-op-accent">
            <p className="text-sm font-semibold opacity-80">Jouw rol</p>
            <p className="text-2xl font-extrabold">{missie.titel}</p>
          </div>
          <div className="max-h-[45dvh] space-y-3 overflow-y-auto">
            {missie.tekst.map((alinea, i) => (
              <p key={i} style={{ '--i': i }} className={`opkomen ${i === 0 || alinea.startsWith('Let op') ? 'font-semibold' : ''}`}>
                {alinea}
              </p>
            ))}
          </div>
          <Knop className="mt-5 w-full" onClick={onSluit}>
            Missie aanvaard
          </Knop>
        </>
      )}
    </Sheet>
  )
}
