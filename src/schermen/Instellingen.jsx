import { useState } from 'react'
import { api } from '../lib/api.js'
import { lees, schrijf, wis } from '../lib/opslag.js'
import { Fout, Modal } from '../onderdelen/Algemeen.jsx'

export default function Instellingen({ open, onSluit, naam, onUitloggen, onOrgGewijzigd }) {
  const [orgCode, setOrgCode] = useState('')
  const [melding, setMelding] = useState('')
  const [fout, setFout] = useState('')
  const isOrg = !!lees('orgcode')

  async function controleer() {
    setFout('')
    setMelding('')
    schrijf('orgcode', orgCode.trim())
    try {
      const { organisator } = await api('aanmelden', { methode: 'POST', body: {} })
      if (!organisator) throw new Error('Netjes geprobeerd. Die code klopt niet.')
      setMelding('Welkom, baas. Preview staat aan.')
      setOrgCode('')
      onOrgGewijzigd()
    } catch (e) {
      wis('orgcode')
      setFout(e.message)
    }
  }

  function stopPreview() {
    wis('orgcode')
    wis('enveloppe-open')
    setMelding('Preview uit.')
    onOrgGewijzigd()
  }

  return (
    <Modal open={open} onSluit={onSluit}>
      <p className="label">Agentgegevens</p>
      <p className="mt-1 text-lg">
        Ingelogd als <b className="text-goud-licht">{naam}</b>
      </p>
      <button
        className="knop-stil mt-3 w-full"
        onClick={() => {
          wis('naam')
          onSluit()
          onUitloggen()
        }}
      >
        Wissel van agent
      </button>

      <hr className="my-5 border-paars-700" />
      <p className="label">Alleen voor de organisatie</p>
      {isOrg ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-paars-300">Preview staat aan. De enveloppe kan geopend worden.</p>
          <button
            className="knop-stil w-full"
            onClick={() => {
              wis('enveloppe-open')
              setMelding('Enveloppe weer dichtgeplakt. Ga naar Basis om hem opnieuw te openen.')
            }}
          >
            Enveloppe opnieuw dichtplakken
          </button>
          <button className="knop-stil w-full" onClick={stopPreview}>
            Preview uitzetten
          </button>
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <input
            className="invoer"
            type="password"
            value={orgCode}
            onChange={(e) => setOrgCode(e.target.value)}
            placeholder="Geheime code"
            autoComplete="off"
          />
          <button className="knop" onClick={controleer} disabled={!orgCode.trim()}>
            OK
          </button>
        </div>
      )}
      {melding && <p className="mt-2 text-sm text-goud-licht">{melding}</p>}
      <Fout>{fout}</Fout>
      <button className="knop mt-5 w-full" onClick={onSluit}>
        Sluiten
      </button>
    </Modal>
  )
}
