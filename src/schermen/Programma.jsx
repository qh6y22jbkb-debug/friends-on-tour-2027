import { CalendarDays, CircleAlert, Lock } from 'lucide-react'
import { Blok, Kop, Rij } from '../ui.jsx'

export default function Programma({ dagen, ontgrendeld, open }) {
  return (
    <>
      <Kop titel="Programma" sub="Elke dag gaat open met een eigen wachtwoord." />
      <Blok>
        {dagen.map((d, i) => {
          const dag = ontgrendeld[d.id]
          return (
            <Rij
              key={d.id}
              i={i}
              icoon={dag ? CalendarDays : Lock}
              titel={`Dag ${i + 1}`}
              sub={dag ? `${d.datum} · ${dag.titel}` : d.datum}
              onClick={() => open(d.id, `Dag ${i + 1} · ${d.datum}`)}
            />
          )
        })}
      </Blok>
    </>
  )
}

export function Dag({ dag, terug }) {
  if (!dag) return <Kop titel="Niet geopend" terug={terug} />
  return (
    <>
      <Kop titel={dag.titel} sub={dag.datum} terug={terug} />
      <Blok>
        {dag.items.map((item, i) => (
          <div key={i} style={{ '--i': i }} className="opkomen flex gap-3 border-b border-rand px-4 py-3 last:border-b-0">
            <span className="w-5 shrink-0 text-sm text-tekst-zacht tabular-nums">{i + 1}</span>
            <span>{item}</span>
          </div>
        ))}
      </Blok>
      {dag.notitie && (
        <div className="opkomen flex gap-3 rounded-xl border border-rand bg-vlak-zacht p-4" style={{ '--i': dag.items.length }}>
          <CircleAlert size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm">{dag.notitie}</p>
        </div>
      )}
    </>
  )
}
