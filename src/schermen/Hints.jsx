import { useEffect } from 'react'
import hints from '../data/hints.json'
import { verdien } from '../lib/badges.js'
import { datumAmsterdam, mooieDatum } from '../lib/tijd.js'

export default function Hints({ nu }) {
  const vandaag = datumAmsterdam(nu)
  const open = hints.filter((h) => h.datum <= vandaag).reverse()
  const volgende = hints.find((h) => h.datum > vandaag)
  const dicht = hints.length - open.length

  useEffect(() => {
    if (open.length >= 10) verdien('speurder')
  }, [open.length])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="kop text-3xl">Cryptische hints</h1>
        <p className="text-paars-300">
          Om de paar dagen lekt er iets uit. Of het klopt? Daar zeggen we niks over.
        </p>
      </div>

      {volgende && (
        <div className="kaart flex items-center gap-3 border-dashed">
          <span className="text-3xl">🔒</span>
          <div>
            <p className="label">Volgende hint</p>
            <p className="font-semibold">{mooieDatum(volgende.datum)}</p>
            <p className="text-xs text-paars-300">Nog {dicht} hints in de kluis</p>
          </div>
        </div>
      )}

      {open.length === 0 && <p className="text-paars-300">Nog geen hints. Geduld is ook een agentenvaardigheid.</p>}

      {open.map((h, i) => (
        <article key={h.datum} className={`kaart binnenkomen ${i === 0 ? 'border-goud' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="label">Hint #{hints.indexOf(h) + 1}</span>
            <span className="text-xs text-paars-300">{mooieDatum(h.datum)}</span>
          </div>
          <p className="mt-2 font-typemachine text-lg leading-relaxed">{h.tekst}</p>
          {i === 0 && <span className="stempel mt-3">Nieuw</span>}
        </article>
      ))}
    </div>
  )
}
