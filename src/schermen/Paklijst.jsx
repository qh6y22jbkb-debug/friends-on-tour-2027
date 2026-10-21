import { useState } from 'react'
import paklijst from '../data/paklijst.json'
import { lees, schrijf } from '../lib/opslag.js'
import { Blok, Kop, Teller, Vinkrij } from '../ui.jsx'

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

  const klaar = paklijst.reduce((n, g) => n + g.items.filter((it) => afgevinkt.has(it.id)).length, 0)
  let i = 0

  return (
    <>
      <Kop titel="Paklijst" sub="Je vinkjes worden op deze telefoon onthouden." />

      <section className="mb-8 rounded-[28px] bg-vlak p-5">
        <div className="mb-1 text-center text-[56px] leading-none font-extrabold tracking-tight">
          <Teller waarde={klaar} />
          <span className="text-tekst-zacht">/{TOTAAL}</span>
        </div>
        <p className="mb-5 text-center text-tekst-zacht">
          {klaar === TOTAAL ? 'Alles ingepakt. Klaar voor vertrek.' : 'spullen ingepakt'}
        </p>
        <Staven groepen={paklijst} afgevinkt={afgevinkt} />
      </section>

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

// Staande pillen per groep die vollopen naarmate je inpakt.
function Staven({ groepen, afgevinkt }) {
  return (
    <div className="grid gap-2 border-t border-rand pt-5" style={{ gridTemplateColumns: `repeat(${groepen.length}, minmax(0, 1fr))` }}>
      {groepen.map((g, n) => {
        const deel = g.items.filter((it) => afgevinkt.has(it.id)).length / g.items.length
        return (
          <div key={g.groep} className="flex flex-col items-center gap-2">
            <div className="relative h-36 w-full overflow-hidden rounded-full bg-vlak-zacht">
              <div
                className="balk absolute inset-0 rounded-full"
                style={{ background: `var(--staaf-${(n % 5) + 1})`, transform: `translateY(${(1 - deel) * 100}%)` }}
              />
              <span
                className={`absolute inset-x-0 bottom-3 text-center text-xs font-semibold tabular-nums ${
                  deel >= 0.2 ? (n === 0 ? 'text-op-accent' : 'text-white') : 'text-tekst-zacht'
                }`}
              >
                {Math.round(deel * 100)}%
              </span>
            </div>
            <span className="w-full truncate text-center text-xs font-medium">{g.kort ?? g.groep}</span>
          </div>
        )
      })}
    </div>
  )
}
