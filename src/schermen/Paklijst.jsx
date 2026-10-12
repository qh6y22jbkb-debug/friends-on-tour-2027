import { useEffect, useState } from 'react'
import paklijst from '../data/paklijst.json'
import { api } from '../lib/api.js'
import { Blok, Fout, Kop, Teller, Vinkrij, Voortgang } from '../ui.jsx'

const TOTAAL = paklijst.reduce((n, g) => n + g.items.length, 0)

export default function Paklijst() {
  const [afgevinkt, setAfgevinkt] = useState(null)
  const [fout, setFout] = useState('')

  useEffect(() => {
    api('paklijst')
      .then((r) => setAfgevinkt(new Set(r.afgevinkt)))
      .catch((e) => setFout(e.message))
  }, [])

  async function wissel(id) {
    const klaar = !afgevinkt.has(id)
    // Direct tonen, daarna opslaan; bij een fout terugdraaien.
    const nieuw = new Set(afgevinkt)
    klaar ? nieuw.add(id) : nieuw.delete(id)
    setAfgevinkt(nieuw)
    try {
      await api('paklijst', { methode: 'POST', body: { id, klaar } })
    } catch (e) {
      setFout(e.message)
      setAfgevinkt(afgevinkt)
    }
  }

  const klaar = afgevinkt?.size ?? 0
  let i = 0

  return (
    <>
      <Kop titel="Paklijst" sub="Je vinkjes worden bewaard op al je apparaten." />
      <div className="mb-6 rounded-xl border border-rand bg-vlak p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>
            <Teller waarde={klaar} /> van {TOTAAL} ingepakt
          </span>
          <span className="text-tekst-zacht">
            <Teller waarde={TOTAAL ? (klaar / TOTAAL) * 100 : 0} />%
          </span>
        </div>
        <Voortgang waarde={klaar} totaal={TOTAAL} />
      </div>
      <Fout>{fout}</Fout>
      {afgevinkt &&
        paklijst.map((g) => (
          <Blok key={g.groep} titel={g.groep}>
            {g.items.map((item) => (
              <Vinkrij key={item.id} i={i++} aan={afgevinkt.has(item.id)} titel={item.tekst} onWissel={() => wissel(item.id)} />
            ))}
          </Blok>
        ))}
    </>
  )
}
