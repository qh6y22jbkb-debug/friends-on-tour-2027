import { Backpack, ClipboardList, LifeBuoy, Lightbulb, Lock } from 'lucide-react'
import { TITEL } from '../config.js'
import { dagInfo, datumAmsterdam, resterend } from '../lib/tijd.js'
import { Sectiekop, Tegel } from '../ui.jsx'

export default function Start({ nu, onthuld, isOrg, naam, dagen, open, ontgrendeld, ga }) {
  let i = 0
  const vandaag = datumAmsterdam(nu)
  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-tekst-zacht">{TITEL}</p>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">Hoi {naam}</h1>
        </div>
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-op-accent"
        >
          {naam[0]}
        </span>
      </header>

      {/* Reisdagen als rij rondjes; vandaag krijgt de accentkleur. */}
      <div className="mb-8 grid gap-2" style={{ gridTemplateColumns: `repeat(${dagen.length}, minmax(0, 1fr))` }}>
        {dagen.map((d, n) => {
          const info = dagInfo(d.datum)
          const isVandaag = info.iso === vandaag
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => open(d.id, `Dag ${n + 1} · ${d.datum}`)}
              style={{ '--i': n }}
              className="opkomen flex flex-col items-center gap-2"
              aria-label={`Dag ${n + 1}, ${d.datum}${ontgrendeld[d.id] ? '' : ', op slot'}`}
            >
              <span className={`text-sm ${isVandaag ? 'font-bold' : 'text-tekst-zacht'}`}>{info.kort}</span>
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold transition-transform duration-150 active:scale-95 ${
                  isVandaag ? 'bg-accent text-op-accent' : 'bg-vlak'
                }`}
              >
                {info.nr}
                {!ontgrendeld[d.id] && (
                  <span className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-achtergrond">
                    <Lock size={11} strokeWidth={2.5} className="text-tekst-zacht" />
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <Sectiekop titel="Onze reis" />
      <div className="mb-8 grid grid-cols-[1fr_76px] gap-3">
        <Aftelklok nu={nu} onthuld={onthuld} />
        <button
          type="button"
          onClick={() => open('bestemming', 'Bestemming')}
          className="opkomen relative flex flex-col items-center justify-between rounded-[28px] bg-tint-zand py-5 transition-transform duration-150 active:scale-[0.98]"
          style={{ '--i': 1 }}
          aria-label={`Bestemming${ontgrendeld.bestemming ? '' : ', op slot'}`}
        >
          {ontgrendeld.bestemming ? <span className="h-4" /> : <Lock size={16} strokeWidth={2.25} />}
          <span className="text-lg font-semibold whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
            Bestemming
          </span>
          <span className="h-4" />
        </button>
      </div>

      <Sectiekop titel="Snel naar" />
      <div className="grid grid-cols-2 gap-3">
        <Tegel
          i={i++}
          tint="roze"
          icoon={Backpack}
          titel="Paklijst"
          sub="Afvinken wat je meeneemt"
          voet="Altijd"
          onClick={() => ga({ tab: 'paklijst', scherm: null })}
        />
        <Tegel
          i={i++}
          tint="lila"
          icoon={LifeBuoy}
          titel="Praktisch"
          sub="Adres en noodnummers"
          voet={onthuld || isOrg ? '' : '28 april'}
          slot={!ontgrendeld.praktisch}
          onClick={() => open('praktisch', 'Praktisch')}
        />
        {isOrg && (
          <Tegel
            i={i++}
            tint="salie"
            icoon={ClipboardList}
            titel="Organisatie"
            sub="Boekingen en actiepunten"
            voet="Organisatoren"
            onClick={() => ga({ scherm: { soort: 'organisatie' } })}
          />
        )}
        <Tegel
          i={i++}
          tint={isOrg ? 'zand' : 'salie'}
          icoon={Lightbulb}
          titel="Hints"
          sub="Om de paar dagen een nieuwe"
          voet="Altijd"
          breed={!isOrg}
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
      <div className="opkomen flex min-h-56 flex-col justify-center rounded-[28px] bg-accent p-6 text-op-accent">
        <p className="text-2xl font-bold">De bestemming is bekend</p>
        <p className="mt-2 opacity-80">Tik op Bestemming en vul het wachtwoord in.</p>
      </div>
    )
  }
  return (
    <div className="opkomen flex min-h-56 flex-col justify-between rounded-[28px] bg-accent p-6 text-op-accent" aria-live="off">
      <p className="text-lg font-semibold">Tot de onthulling</p>
      <div>
        <div className="overflow-hidden text-[72px] leading-none font-extrabold tracking-tight tabular-nums">
          <span key={r.dagen} className="cijfer">
            {r.dagen}
          </span>
        </div>
        <p className="mt-1 font-medium">{r.dagen === 1 ? 'dag' : 'dagen'}</p>
      </div>
      <p className="text-sm font-medium opacity-80 tabular-nums">
        <span key={r.uren} className="cijfer">
          {r.uren}
        </span>{' '}
        uur ·{' '}
        <span key={r.minuten} className="cijfer">
          {r.minuten}
        </span>{' '}
        min
      </p>
    </div>
  )
}
