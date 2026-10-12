import { Blok, Kop, Regels } from '../ui.jsx'

export default function Bestemming({ inhoud, terug }) {
  if (!inhoud) return <Kop titel="Niet geopend" terug={terug} />
  return (
    <>
      <Kop titel={inhoud.plaats} sub={[inhoud.regio, inhoud.periode].filter(Boolean).join(' · ')} terug={terug} />
      <Blok>
        <Regels regels={inhoud.regels} />
      </Blok>
    </>
  )
}
