import { useState } from 'react'
import paklijst from '../data/paklijst.json'
import { lees, schrijf } from '../lib/opslag.js'
import { Blok, Kop, Teller, Vinkrij, Voortgang } from '../ui.jsx'

const TOTAAL = paklijst.reduce((n, g) => n + g.items.length, 0)

export default function Paklijst({ naam }) {
  const sleutel = 'paklijst-' + naam
  const [afgevinkt, setAfgevinkt] = useState(() => new Set(lees(sleutel, [])))

  function wissel(id) {
    const nieuw = new Set(afgevinkt)
    nieuw.has(id) ? nieuw.delete(id) : nieuw.add(id)
    setAfgevinkt(nieuw)
    schrijf(sleutel, [...nieuw])
  }

  const klaar = afgevinkt.size
  let i = 0

  return (
    <>
      <Kop titel="Paklijst" sub="Je vinkjes worden op deze telefoon onthouden." />
      <div className="mb-6 rounded-xl border border-rand bg-vlak p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>
            <Teller waarde={klaar} /> van {TOTAAL} ingepakt
          </span>
          <span className="text-tekst-zacht">
            <Teller waarde={(klaar / TOTAAL) * 100} />%
          </span>
        </div>
        <Voortgang waarde={klaar} totaal={TOTAAL} />
      </div>
      {paklijst.map((g) => (
        <Blok key={g.groep} titel={g.groep}>
          {g.items.map((item) => (
            <Vinkrij key={item.id} i={i++} aan={afgevinkt.has(item.id)} titel={item.tekst} onWissel={() => wissel(item.id)} />
          ))}
        </Blok>
      ))}
    </>
  )
}
