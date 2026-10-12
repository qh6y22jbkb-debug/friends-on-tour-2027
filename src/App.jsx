import { useCallback, useEffect, useState } from 'react'
import { api } from './lib/api.js'
import { lees, schrijf } from './lib/opslag.js'
import { ONTHULLING_MS, syncTijd, useNu } from './lib/tijd.js'
import { BadgeMelding, Logo } from './onderdelen/Algemeen.jsx'
import Aanmelden from './schermen/Aanmelden.jsx'
import Basis from './schermen/Basis.jsx'
import Hints from './schermen/Hints.jsx'
import Spellen from './schermen/Spellen.jsx'
import Groep from './schermen/Groep.jsx'
import Dossier from './schermen/Dossier.jsx'
import Enveloppe from './schermen/Enveloppe.jsx'
import Instellingen from './schermen/Instellingen.jsx'

const TABS = [
  ['basis', '⏱️', 'Basis'],
  ['hints', '🔎', 'Hints'],
  ['spellen', '🎲', 'Spellen'],
  ['groep', '👥', 'Groep'],
  ['dossier', '📁', 'Dossier'],
]

export default function App() {
  const [naam, setNaam] = useState(() => lees('naam'))
  const [tab, setTab] = useState(() => lees('tab', 'basis'))
  const [onthulling, setOnthulling] = useState({ open: false })
  const [enveloppe, setEnveloppe] = useState(false)
  const [instellingen, setInstellingen] = useState(false)
  const nu = useNu()
  const tijdIsDaar = nu >= ONTHULLING_MS

  useEffect(() => {
    syncTijd()
    const id = setInterval(syncTijd, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const haalOnthulling = useCallback(async () => {
    try {
      setOnthulling(await api('onthulling'))
    } catch {
      /* offline of nog geen toegang */
    }
  }, [])

  // Ophalen bij het opstarten, en opnieuw zodra de servertijd het moment passeert.
  useEffect(() => {
    if (naam) haalOnthulling()
  }, [naam, tijdIsDaar, haalOnthulling])

  function kiesTab(t) {
    setTab(t)
    schrijf('tab', t)
    window.scrollTo({ top: 0 })
  }

  if (!naam) return <Aanmelden onKlaar={setNaam} />

  const open = onthulling.open
  const gedeeld = { naam, nu, open, onthulling, haalOnthulling }

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-28">
      <BadgeMelding />
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-goud/15 bg-nacht/85 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur">
        <Logo />
        <button onClick={() => setInstellingen(true)} className="text-right" aria-label="Instellingen">
          <span className="block font-typemachine text-[10px] tracking-[0.2em] text-paars-300">AGENT</span>
          <span className="block font-bold text-goud-licht">{naam} ⚙️</span>
        </button>
      </header>

      {onthulling.preview && (
        <div className="bg-zegel px-4 py-1.5 text-center font-typemachine text-xs tracking-widest text-white">
          ORGANISATOR-PREVIEW · alleen jij ziet dit
        </div>
      )}

      <main className="px-4 pt-4">
        {tab === 'basis' && <Basis {...gedeeld} onOpenEnveloppe={() => setEnveloppe(true)} />}
        {tab === 'hints' && <Hints {...gedeeld} />}
        {tab === 'spellen' && <Spellen {...gedeeld} />}
        {tab === 'groep' && <Groep {...gedeeld} />}
        {tab === 'dossier' && <Dossier {...gedeeld} onOpenEnveloppe={() => setEnveloppe(true)} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-goud/20 bg-paars-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {TABS.map(([id, emoji, label]) => (
            <button
              key={id}
              onClick={() => kiesTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                tab === id ? 'text-goud-licht' : 'text-paars-300/70'
              }`}
            >
              <span className={`text-xl transition ${tab === id ? 'scale-110' : 'opacity-70 grayscale'}`}>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {enveloppe && open && (
        <Enveloppe
          data={onthulling.data}
          onKlaar={() => {
            setEnveloppe(false)
            schrijf('enveloppe-open', true)
            kiesTab('dossier')
          }}
        />
      )}
      <Instellingen
        open={instellingen}
        onSluit={() => setInstellingen(false)}
        naam={naam}
        onUitloggen={() => setNaam(null)}
        onOrgGewijzigd={haalOnthulling}
      />
    </div>
  )
}
