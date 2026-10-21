import { CalendarDays, CircleAlert, ExternalLink, Lock } from 'lucide-react'
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
      {dag.links?.length > 0 && (
        <Blok titel="Links">
          {dag.links.map((l, i) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              style={{ '--i': dag.items.length + i }}
              className="opkomen flex min-h-12 items-center gap-3 border-b border-rand px-5 py-3 font-semibold last:border-b-0 active:bg-vlak-zacht/50"
            >
              <span className="flex-1">{l.tekst}</span>
              <ExternalLink size={18} strokeWidth={1.75} className="shrink-0" />
            </a>
          ))}
        </Blok>
      )}
      {dag.notitie && (
        <div className="opkomen flex gap-3 rounded-[24px] bg-accent-zacht p-5" style={{ '--i': dag.items.length }}>
          <CircleAlert size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 " />
          <p className="text-sm">{dag.notitie}</p>
        </div>
      )}
    </>
  )
}
