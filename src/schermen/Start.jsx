import { Backpack, CalendarDays, ClipboardList, LifeBuoy, Lightbulb, MapPin, Wallet } from 'lucide-react'
import { TITEL } from '../config.js'
import { resterend } from '../lib/tijd.js'
import { Tegel } from '../ui.jsx'

export default function Start({ nu, onthuld, isOrg, sessie, start, open, ontgrendeld, ga }) {
  const dagen = start?.dagen ?? []
  let i = 0
  return (
    <>
      <header className="mb-6">
        <p className="text-sm font-medium text-accent">{TITEL}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Hoi {sessie.naam}</h1>
      </header>

      <Aftelklok nu={nu} onthuld={onthuld} />

      <div className="grid grid-cols-2 gap-3">
        <Tegel
          breed
          i={i++}
          icoon={MapPin}
          titel="Bestemming"
          sub={onthuld || isOrg ? 'Bekijk waar we heen gaan' : 'Opent 28 april 2027'}
          slot={!isOrg && !ontgrendeld.bestemming}
          onClick={() => open('bestemming', 'Bestemming')}
        />
        {dagen.map((d, n) => (
          <Tegel
            key={d.id}
            i={i++}
            icoon={CalendarDays}
            titel={`Dag ${n + 1}`}
            sub={d.datum}
            slot={!isOrg && !ontgrendeld[d.id]}
            onClick={() => open(d.id, `Dag ${n + 1} · ${d.datum}`)}
          />
        ))}
        <Tegel i={i++} icoon={Backpack} titel="Paklijst" sub="Afvinken" onClick={() => ga({ tab: 'paklijst', scherm: null })} />
        <Tegel i={i++} icoon={Wallet} titel="Kosten" sub="Wie betaalde wat" onClick={() => ga({ scherm: { soort: 'kosten' } })} />
        {isOrg && (
          <Tegel
            i={i++}
            icoon={ClipboardList}
            titel="Organisatie"
            sub="Alleen organisatoren"
            onClick={() => ga({ scherm: { soort: 'organisatie' } })}
          />
        )}
        <Tegel
          i={i++}
          icoon={LifeBuoy}
          titel="Praktisch"
          sub={onthuld || isOrg ? 'Adres en noodnummers' : 'Opent 28 april 2027'}
          slot={!onthuld && !isOrg}
          onClick={() => open('praktisch', 'Praktisch')}
        />
        <Tegel
          i={i++}
          icoon={Lightbulb}
          titel="Hints"
          sub="Om de paar dagen een nieuwe"
          breed={isOrg}
          onClick={() => ga({ scherm: { soort: 'hints' } })}
        />
      </div>
    </>
  )
}

function Aftelklok({ nu, onthuld }) {
  const r = resterend(nu)
  if (onthuld) {
    return (
      <div className="mb-6 rounded-xl border border-rand bg-accent-zacht p-4">
        <p className="font-medium">De bestemming is bekend.</p>
        <p className="text-sm text-tekst-zacht">Open de tegel Bestemming met het wachtwoord.</p>
      </div>
    )
  }
  const vakken = [
    [r.dagen, r.dagen === 1 ? 'dag' : 'dagen'],
    [r.uren, 'uur'],
    [r.minuten, 'min'],
  ]
  return (
    <div className="mb-6 rounded-xl border border-rand bg-vlak p-4" aria-live="off">
      <p className="mb-3 text-sm text-tekst-zacht">Tot de onthulling</p>
      <div className="grid grid-cols-3 gap-2">
        {vakken.map(([waarde, label]) => (
          <div key={label} className="rounded-lg bg-vlak-zacht px-2 py-3 text-center">
            <div className="overflow-hidden text-3xl font-semibold tabular-nums">
              <span key={waarde} className="cijfer">
                {waarde}
              </span>
            </div>
            <div className="text-xs text-tekst-zacht">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
