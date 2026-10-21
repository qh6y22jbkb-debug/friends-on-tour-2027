import { ClipboardList, Gem, LifeBuoy, LogOut, MapPin } from 'lucide-react'
import { Avatar, Blok, Kop, Rij } from '../ui.jsx'

export default function Meer({ naam, isOrg, onthuld, open, ga, onUitloggen }) {
  let i = 0
  return (
    <>
      <Kop titel="Meer" />
      <div className="mb-6 flex items-center gap-4 rounded-[28px] bg-vlak p-5">
        <Avatar naam={naam} maat={64} />
        <div>
          <p className="text-xl font-bold">{naam}</p>
          <p className="text-tekst-zacht">{isOrg ? 'Organisator' : 'Deelnemer'}</p>
        </div>
      </div>
      <Blok>
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
        <Rij i={i++} icoon={Gem} titel="Schatkisten" onClick={() => ga({ scherm: { soort: 'hints' } })} />
      </Blok>
      <Blok>
        <Rij i={i++} icoon={LogOut} titel="Andere naam kiezen" onClick={onUitloggen} pijl={false} />
      </Blok>
    </>
  )
}
