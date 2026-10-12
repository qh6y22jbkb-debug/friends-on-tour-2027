import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { mooieDatum } from '../lib/tijd.js'
import { Blok, Fout, Kop, Laden, Link, Regels, Teller, Vinkrij, Voortgang } from '../ui.jsx'

export default function Organisatie({ terug }) {
  const [data, setData] = useState(null)
  const [fout, setFout] = useState('')

  useEffect(() => {
    api('organisatie').then(setData).catch((e) => setFout(e.message))
  }, [])

  async function wissel(id) {
    const klaar = !data.status[id]
    try {
      setData(await api('organisatie', { methode: 'POST', body: { id, klaar } }))
    } catch (e) {
      setFout(e.message)
    }
  }

  if (!data) return fout ? <Fout>{fout}</Fout> : <Laden />
  const { inhoud, status } = data
  const punten = [...(inhoud.boekingen ?? []), ...(inhoud.actiepunten ?? [])]
  const klaar = punten.filter((p) => status[p.id]).length
  const door = (id) => (status[id] ? ` · afgevinkt door ${status[id].door}` : '')
  let i = 0

  return (
    <>
      <Kop titel="Organisatie" sub="Alleen zichtbaar voor organisatoren." terug={terug} />

      <div className="mb-6 rounded-xl border border-rand bg-vlak p-4">
        <p className="mb-2 text-sm">
          <Teller waarde={klaar} /> van {punten.length} geregeld
        </p>
        <Voortgang waarde={klaar} totaal={punten.length} />
      </div>
      <Fout>{fout}</Fout>

      {inhoud.boekingen?.length > 0 && (
        <Blok titel="Boekingen">
          {inhoud.boekingen.map((b) => (
            <div key={b.id} className="flex items-center border-b border-rand last:border-b-0">
              <div className="flex-1">
                <Vinkrij
                  i={i++}
                  aan={!!status[b.id]}
                  onWissel={() => wissel(b.id)}
                  titel={b.wat}
                  sub={`Deadline: ${mooieDatum(b.deadline)}${door(b.id)}`}
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
            <Vinkrij
              key={a.id}
              i={i++}
              aan={!!status[a.id]}
              onWissel={() => wissel(a.id)}
              titel={a.tekst}
              sub={[a.wanneer, door(a.id).replace(/^ · /, '')].filter(Boolean).join(' · ')}
            />
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
