import { useState } from 'react'
import { lees, schrijf } from '../lib/opslag.js'
import { mooieDatum } from '../lib/tijd.js'
import { Blok, Kop, Link, Regels, Teller, Vinkrij, Voortgang } from '../ui.jsx'

export default function Organisatie({ inhoud, terug }) {
  const [klaarSet, setKlaarSet] = useState(() => new Set(lees('organisatie-klaar', [])))
  if (!inhoud) return <Kop titel="Niet geopend" terug={terug} />

  function wissel(id) {
    const nieuw = new Set(klaarSet)
    nieuw.has(id) ? nieuw.delete(id) : nieuw.add(id)
    setKlaarSet(nieuw)
    schrijf('organisatie-klaar', [...nieuw])
  }

  const punten = [...(inhoud.boekingen ?? []), ...(inhoud.actiepunten ?? [])]
  const klaar = punten.filter((p) => klaarSet.has(p.id)).length
  let i = 0

  return (
    <>
      <Kop titel="Organisatie" sub="Alleen voor organisatoren. Afvinken wordt op deze telefoon onthouden." terug={terug} />

      <div className="mb-8 rounded-[28px] bg-vlak p-5">
        <p className="mb-2 text-sm">
          <Teller waarde={klaar} /> van {punten.length} geregeld
        </p>
        <Voortgang waarde={klaar} totaal={punten.length} />
      </div>

      {inhoud.boekingen?.length > 0 && (
        <Blok titel="Boekingen">
          {inhoud.boekingen.map((b) => (
            <div key={b.id} className="flex items-center border-b border-rand last:border-b-0">
              <div className="flex-1">
                <Vinkrij
                  i={i++}
                  aan={klaarSet.has(b.id)}
                  onWissel={() => wissel(b.id)}
                  titel={b.wat}
                  sub={`Deadline: ${mooieDatum(b.deadline)}`}
                />
              </div>
              {b.link && (
                <span className="shrink-0 pr-4">
                  <Link href={b.link}>Link</Link>
                </span>
              )}
            </div>
          ))}
        </Blok>
      )}

      {inhoud.actiepunten?.length > 0 && (
        <Blok titel="Actiepunten">
          {inhoud.actiepunten.map((a) => (
            <Vinkrij key={a.id} i={i++} aan={klaarSet.has(a.id)} onWissel={() => wissel(a.id)} titel={a.tekst} sub={a.wanneer} />
          ))}
        </Blok>
      )}

      {inhoud.heen?.length > 0 && (
        <Blok titel="Heenreis">
          <Regels regels={inhoud.heen} />
        </Blok>
      )}
      {inhoud.terug?.length > 0 && (
        <Blok titel="Terugreis">
          <Regels regels={inhoud.terug} />
        </Blok>
      )}
      {inhoud.verblijf?.length > 0 && (
        <Blok titel="Verblijf">
          <Regels regels={inhoud.verblijf} />
        </Blok>
      )}
      {inhoud.terPlekke?.length > 0 && (
        <Blok titel="Vervoer ter plekke">
          <Regels regels={inhoud.terPlekke} />
        </Blok>
      )}
    </>
  )
}
