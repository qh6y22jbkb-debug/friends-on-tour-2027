import { useEffect, useState } from 'react'
import { hints, leesHint } from '../lib/kluis.js'
import { datumAmsterdam, mooieDatum } from '../lib/tijd.js'
import { Blok, Kop } from '../ui.jsx'

export default function Hints({ nu, terug }) {
  const vandaag = datumAmsterdam(nu)
  const open = hints.filter((h) => h.datum <= vandaag).reverse()
  const volgende = hints.find((h) => h.datum > vandaag)
  const [teksten, setTeksten] = useState({})

  // Alleen hints waarvan de datum er is worden ontsleuteld.
  useEffect(() => {
    let weg = false
    Promise.all(open.map(async (h) => [h.i, await leesHint(h.i)])).then((paren) => {
      if (!weg) setTeksten(Object.fromEntries(paren))
    })
    return () => {
      weg = true
    }
  }, [open.length])

  return (
    <>
      <Kop titel="Hints" sub="Of ze kloppen? Daar zeggen we niets over." terug={terug} />
      {volgende && (
        <p className="mb-4 text-sm text-tekst-zacht">
          Volgende hint op {mooieDatum(volgende.datum)} · nog {hints.length - open.length} te gaan
        </p>
      )}
      {open.length === 0 ? (
        <p className="text-tekst-zacht">Nog geen hints.</p>
      ) : (
        <Blok>
          {open.map((h, i) => (
            <div key={h.i} style={{ '--i': Math.min(i, 12) }} className="opkomen border-b border-rand px-5 py-3.5 last:border-b-0">
              <p className="text-sm text-tekst-zacht">{mooieDatum(h.datum)}</p>
              <p>{teksten[h.i] ?? '…'}</p>
            </div>
          ))}
        </Blok>
      )}
    </>
  )
}
