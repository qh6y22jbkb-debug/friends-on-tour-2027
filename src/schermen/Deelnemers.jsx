import { useEffect, useState } from 'react'
import { KeyRound, User } from 'lucide-react'
import { api } from '../lib/api.js'
import { Blok, Fout, Knop, Kop, Laden, Rij, Sheet } from '../ui.jsx'

export default function Deelnemers({ sessie, terug }) {
  const [lijst, setLijst] = useState(null)
  const [fout, setFout] = useState('')
  const [reset, setReset] = useState(null)

  const laad = () =>
    api('deelnemers')
      .then((r) => setLijst(r.deelnemers))
      .catch((e) => setFout(e.message))
  useEffect(() => {
    laad()
  }, [])

  async function bevestig() {
    try {
      await api('reset', { methode: 'POST', body: { naam: reset } })
      setReset(null)
      laad()
    } catch (e) {
      setFout(e.message)
      setReset(null)
    }
  }

  return (
    <>
      <Kop titel="Deelnemers" sub="Na een reset maakt iemand bij de volgende keer inloggen een nieuw wachtwoord aan." terug={terug} />
      <Fout>{fout}</Fout>
      {!lijst ? (
        <Laden />
      ) : (
        <Blok>
          {lijst.map((d, i) => (
            <Rij
              key={d.naam}
              i={i}
              icoon={User}
              titel={d.naam}
              sub={`${d.rol === 'organisator' ? 'Organisator' : 'Deelnemer'} · ${d.heeftWachtwoord ? 'wachtwoord ingesteld' : 'nog geen wachtwoord'}`}
              pijl={false}
              rechts={
                d.heeftWachtwoord && d.naam !== sessie.naam ? (
                  <Knop variant="tekst" className="px-2 text-sm" onClick={() => setReset(d.naam)}>
                    <KeyRound size={16} strokeWidth={1.75} /> Reset
                  </Knop>
                ) : null
              }
            />
          ))}
        </Blok>
      )}
      <Sheet open={!!reset} onSluit={() => setReset(null)} titel={`Wachtwoord van ${reset} resetten?`}>
        <p className="text-tekst-zacht">{reset} wordt uitgelogd en maakt de volgende keer een nieuw wachtwoord aan.</p>
        <div className="mt-6 flex gap-2">
          <Knop variant="rand" className="flex-1" onClick={() => setReset(null)}>
            Annuleren
          </Knop>
          <Knop className="flex-1" onClick={bevestig}>
            Resetten
          </Knop>
        </div>
      </Sheet>
    </>
  )
}
