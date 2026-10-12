import { ClipboardList, LifeBuoy, Lightbulb, LogOut, MapPin, Users, Wallet } from 'lucide-react'
import { Blok, Kop, Rij } from '../ui.jsx'

export default function Meer({ sessie, isOrg, onthuld, open, ga, onUitloggen }) {
  let i = 0
  return (
    <>
      <Kop titel="Meer" sub={`Ingelogd als ${sessie.naam}${isOrg ? ' · organisator' : ''}`} />
      <Blok>
        <Rij i={i++} icoon={Wallet} titel="Kosten" onClick={() => ga({ scherm: { soort: 'kosten' } })} />
        {isOrg && (
          <Rij i={i++} icoon={ClipboardList} titel="Organisatie" onClick={() => ga({ scherm: { soort: 'organisatie' } })} />
        )}
        <Rij
          i={i++}
          icoon={MapPin}
          titel="Bestemming"
          sub={onthuld || isOrg ? null : 'Opent 28 april 2027'}
          onClick={() => open('bestemming', 'Bestemming')}
        />
        <Rij
          i={i++}
          icoon={LifeBuoy}
          titel="Praktisch"
          sub={onthuld || isOrg ? null : 'Opent 28 april 2027'}
          onClick={() => open('praktisch', 'Praktisch')}
        />
        <Rij i={i++} icoon={Lightbulb} titel="Hints" onClick={() => ga({ scherm: { soort: 'hints' } })} />
      </Blok>
      {isOrg && (
        <Blok titel="Beheer">
          <Rij
            i={i++}
            icoon={Users}
            titel="Deelnemers"
            sub="Wachtwoord van iemand resetten"
            onClick={() => ga({ scherm: { soort: 'deelnemers' } })}
          />
        </Blok>
      )}
      <Blok>
        <Rij i={i++} icoon={LogOut} titel="Uitloggen" onClick={onUitloggen} pijl={false} />
      </Blok>
    </>
  )
}
