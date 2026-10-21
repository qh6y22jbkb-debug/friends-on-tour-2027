import { useEffect, useState } from 'react'
import { hints, leesHint } from '../lib/kluis.js'
import { lees, schrijf } from '../lib/opslag.js'
import { datumAmsterdam, mooieDatum } from '../lib/tijd.js'
import { Kop } from '../ui.jsx'

const HOUT = '#7a4b3a'
const HOUT_DONKER = '#5e3729'
const GOUD = '#f2bc4b'
const GOUD_DONKER = '#c9902a'

function dagenTot(vandaag, datum) {
  return Math.round((Date.parse(datum + 'T12:00:00Z') - Date.parse(vandaag + 'T12:00:00Z')) / 86400000)
}

export default function Hints({ nu, naam, isOrg, terug }) {
  const vandaag = datumAmsterdam(nu)
  return (
    <>
      <Kop
        titel="Schatkisten"
        sub={isOrg ? 'Jij kunt alles al zien. De anderen krijgen elke kist pas op zijn datum.' : 'Elke kist gaat open op zijn eigen datum.'}
        terug={terug}
      />
      <div className="space-y-4">
        {hints.map((h, n) => (
          <Kist key={h.i} hint={h} nummer={n + 1} vandaag={vandaag} naam={naam} isOrg={isOrg} />
        ))}
      </div>
    </>
  )
}

function Kist({ hint, nummer, vandaag, naam, isOrg }) {
  const opTijd = hint.datum <= vandaag
  const mag = opTijd || isOrg
  const sleutel = `kist-${naam}-${hint.datum}`
  const [open, setOpen] = useState(() => isOrg || (opTijd && lees(sleutel, false)))
  const [tekst, setTekst] = useState(null)
  const [schud, setSchud] = useState(false)

  useEffect(() => {
    if (open && mag && tekst === null) leesHint(hint.i).then(setTekst)
  }, [open, mag, tekst, hint.i])

  function tik() {
    if (!mag) {
      setSchud(false)
      setTimeout(() => setSchud(true), 20)
      return
    }
    if (!open) {
      setOpen(true)
      schrijf(sleutel, true)
    }
  }

  const nog = dagenTot(vandaag, hint.datum)
  const status = !mag
    ? `Opent op ${mooieDatum(hint.datum)} · nog ${nog} ${nog === 1 ? 'dag' : 'dagen'}`
    : !open
      ? 'Het slot is eraf. Tik om te openen!'
      : isOrg && !opTijd
        ? `Voor de anderen dicht tot ${mooieDatum(hint.datum)}`
        : `Geopend · ${mooieDatum(hint.datum)}`

  return (
    <section style={{ '--i': nummer - 1 }} className="opkomen rounded-[28px] bg-vlak p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Schatkist {nummer}</h2>
        <span className={`text-sm font-medium ${mag && !open ? 'text-tekst' : 'text-tekst-zacht'}`}>{mag ? (open ? 'Open' : 'Klaar') : 'Op slot'}</span>
      </div>

      <button
        type="button"
        onClick={tik}
        aria-label={`Schatkist ${nummer}: ${status}`}
        className="mx-auto mt-8 block w-56 max-w-full transition-transform duration-150 active:scale-[0.97]"
      >
        <span className={`relative block aspect-[5/4] w-full ${schud ? 'schud' : ''}`} onAnimationEnd={() => setSchud(false)}>
          <KistTekening open={open && mag} slot={!mag} />
        </span>
      </button>

      <p className="mt-2 text-center text-sm text-tekst-zacht">{status}</p>

      {open && mag && (
        <div className="opkomen mt-4 rounded-[20px] bg-accent-zacht px-5 py-4 text-center text-lg font-semibold">
          {tekst ?? '…'}
        </div>
      )}
    </section>
  )
}

// Getekende kist: romp, deksel (kantelt open) en een hangslot zolang hij dicht moet blijven.
function KistTekening({ open, slot }) {
  return (
    <>
      {/* Gloed en binnenkant, alleen zichtbaar als het deksel open staat */}
      <svg viewBox="0 0 200 160" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <ellipse
          cx="100"
          cy="64"
          rx="78"
          ry="30"
          fill={GOUD}
          style={{ opacity: open ? 0.35 : 0, transition: 'opacity 500ms ease-out' }}
        />
        <rect x="24" y="58" width="152" height="16" rx="4" fill="#2b1a13" />
      </svg>

      {/* Romp */}
      <svg viewBox="0 0 200 160" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="20" y="70" width="160" height="80" rx="10" fill={HOUT} />
        <path d="M20 104h160M20 128h160" stroke={HOUT_DONKER} strokeWidth="2" opacity="0.6" />
        <rect x="42" y="70" width="12" height="80" fill={GOUD_DONKER} />
        <rect x="146" y="70" width="12" height="80" fill={GOUD_DONKER} />
        <rect x="20" y="70" width="160" height="8" fill={GOUD} />
        <rect x="84" y="78" width="32" height="34" rx="7" fill={GOUD} />
        <circle cx="100" cy="92" r="4.5" fill={HOUT_DONKER} />
        <rect x="98" y="94" width="4" height="9" rx="2" fill={HOUT_DONKER} />
      </svg>

      {/* Deksel: draait om het scharnier achteraan */}
      <svg
        viewBox="0 0 200 160"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{
          transformOrigin: '12% 44%',
          transform: open ? 'translateY(-14%) rotate(-16deg)' : 'none',
          transition: 'transform 600ms var(--veer)',
        }}
      >
        <path d="M20 72V56Q20 22 100 22Q180 22 180 56V72Z" fill={HOUT} />
        <path d="M30 50Q40 32 100 30" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.12" fill="none" />
        <path d="M42 72V30Q46 26 54 25V72Z" fill={GOUD_DONKER} />
        <path d="M146 72V25Q154 26 158 30V72Z" fill={GOUD_DONKER} />
        <rect x="18" y="64" width="164" height="10" rx="3" fill={GOUD} />
      </svg>

      {/* Hangslot */}
      <svg
        viewBox="0 0 200 160"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{ opacity: slot ? 1 : 0, transform: slot ? 'none' : 'translateY(8%)', transition: 'opacity 300ms ease-out, transform 300ms ease-out' }}
      >
        <path d="M89 104v-10a11 11 0 0 1 22 0v10" stroke="#3a3a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="82" y="102" width="36" height="30" rx="7" fill="#2f2f2f" />
        <circle cx="100" cy="114" r="4" fill={GOUD} />
        <rect x="98.5" y="115" width="3" height="8" rx="1.5" fill={GOUD} />
      </svg>
    </>
  )
}
