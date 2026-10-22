import { MapPin, User } from 'lucide-react'
import { persoon } from '../config.js'
import { Avatar, Blok, Kop, Rij } from '../ui.jsx'

const bel = (nummer) => `tel:${String(nummer).replace(/[^\d+]/g, '')}`

export default function Praktisch({ inhoud, missies, terug }) {
  if (!inhoud) return <Kop titel="Niet geopend" terug={terug} />
  const { adres, contacten = [] } = inhoud
  let i = 0
  return (
    <>
      <Kop titel="Praktisch" terug={terug} />
      {adres && (
        <Blok titel="Adres">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(adres.adres)}`}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Rij i={i++} icoon={MapPin} titel={adres.naam} sub={adres.adres} pijl />
          </a>
        </Blok>
      )}
      <Blok titel="Contactpersonen">
        {contacten.map((c) => {
          const rij = (
            <Rij
              i={i++}
              icoon={User}
              voor={persoon(c.naam) ? <Avatar naam={c.naam} maat={40} /> : undefined}
              titel={c.naam}
              sub={c.rol}
              rechts={c.telefoon ? <span className="text-sm font-semibold tabular-nums">{c.telefoon}</span> : null}
              pijl={false}
            />
          )
          return c.telefoon ? (
            <a key={c.naam} href={bel(c.telefoon)} className="block">
              {rij}
            </a>
          ) : (
            <div key={c.naam}>{rij}</div>
          )
        })}
      </Blok>
      {/* Alleen organisatoren hebben de missies ontsleuteld; voor deelnemers is dit leeg. */}
      {missies && Object.keys(missies).length > 0 && (
        <Blok titel="Geheime opdrachten">
          {Object.entries(missies).map(([wie, m]) => (
            <div key={wie} style={{ '--i': i++ }} className="opkomen flex gap-3 border-b border-rand px-5 py-4 last:border-b-0">
              <Avatar naam={wie} maat={40} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {wie} · {m.titel}
                </p>
                <p className="mt-1 text-sm text-tekst-zacht">
                  {m.tekst
                    .slice(1)
                    .filter((t) => !t.startsWith('Let op'))
                    .join(' ')
                    .replace(/^Jouw missie: (.)/, (_, letter) => letter.toUpperCase())}
                </p>
              </div>
            </div>
          ))}
        </Blok>
      )}
    </>
  )
}
