import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { mooieDatum } from '../lib/tijd.js'
import { Blok, Fout, Kop, Laden } from '../ui.jsx'

export default function Hints({ terug }) {
  const [hints, setHints] = useState(null)
  const [fout, setFout] = useState('')

  useEffect(() => {
    api('hints').then(setHints).catch((e) => setFout(e.message))
  }, [])

  return (
    <>
      <Kop titel="Hints" sub="Of ze kloppen? Daar zeggen we niets over." terug={terug} />
      <Fout>{fout}</Fout>
      {!hints && !fout && <Laden />}
      {hints && (
        <>
          {hints.volgende && (
            <p className="mb-4 text-sm text-tekst-zacht">
              Volgende hint op {mooieDatum(hints.volgende)} · nog {hints.totaal - hints.open.length} te gaan
            </p>
          )}
          {hints.open.length === 0 ? (
            <p className="text-tekst-zacht">Nog geen hints.</p>
          ) : (
            <Blok>
              {hints.open.map((h, i) => (
                <div key={h.datum + i} style={{ '--i': i }} className="opkomen border-b border-rand px-4 py-3 last:border-b-0">
                  <p className="text-sm text-tekst-zacht">{mooieDatum(h.datum)}</p>
                  <p>{h.tekst}</p>
                </div>
              ))}
            </Blok>
          )}
        </>
      )}
    </>
  )
}
