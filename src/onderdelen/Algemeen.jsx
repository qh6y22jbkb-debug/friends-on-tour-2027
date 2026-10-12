import { useEffect, useRef, useState } from 'react'
import extra from '../data/extra.json'
import { ACTIE_BADGES, verdien } from '../lib/badges.js'
import { klik } from '../lib/geluid.js'

export function Modal({ open, onSluit, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onSluit}
    >
      <div
        className="kaart binnenkomen w-full max-w-md border-goud/50 bg-paars-900"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// Het logo. Tik er 7 keer snel op en er gebeurt iets geks.
export function Logo() {
  const tikken = useRef([])
  const [bericht, setBericht] = useState(null)
  const [wiebel, setWiebel] = useState(false)

  function tik() {
    const nu = Date.now()
    tikken.current = [...tikken.current.filter((t) => nu - t < 2500), nu]
    setWiebel(true)
    setTimeout(() => setWiebel(false), 150)
    if (tikken.current.length >= 7) {
      tikken.current = []
      klik()
      const lijst = extra.easterEggs
      setBericht(lijst[Math.floor(Math.random() * lijst.length)])
      verdien('ei')
    }
  }

  return (
    <>
      <button
        onClick={tik}
        aria-label="Logo Operatie Mysterieweekend"
        className={`flex items-center gap-2 transition-transform ${wiebel ? 'scale-90' : ''}`}
      >
        <img src="/icoon.svg" alt="" className="h-9 w-9 rounded-lg" />
        <span className="text-left leading-none">
          <span className="block font-typemachine text-[10px] tracking-[0.3em] text-goud">OPERATIE</span>
          <span className="block font-kop text-lg font-black text-goud-licht">Mysterieweekend</span>
        </span>
      </button>
      <Modal open={!!bericht} onSluit={() => setBericht(null)}>
        <span className="stempel mb-3">Vertrouwelijk</span>
        <p className="font-typemachine text-lg leading-relaxed text-white">{bericht}</p>
        <button className="knop mt-5 w-full" onClick={() => setBericht(null)}>
          Ik heb niks gezien
        </button>
      </Modal>
    </>
  )
}

// Laat een melding zien als je een badge verdient.
export function BadgeMelding() {
  const [badge, setBadge] = useState(null)
  useEffect(() => {
    const ontvang = (e) => {
      setBadge(ACTIE_BADGES[e.detail])
      setTimeout(() => setBadge(null), 3500)
    }
    window.addEventListener('omw-badge', ontvang)
    return () => window.removeEventListener('omw-badge', ontvang)
  }, [])
  if (!badge) return null
  return (
    <div className="binnenkomen fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-goud bg-paars-800 p-3 shadow-xl">
      <span className="text-3xl">{badge.emoji}</span>
      <div>
        <p className="label">Badge verdiend</p>
        <p className="font-bold text-goud-licht">{badge.titel}</p>
      </div>
    </div>
  )
}

export function Segmenten({ opties, actief, onKies }) {
  return (
    <div className="mb-4 flex gap-1 rounded-xl bg-paars-950 p-1">
      {opties.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onKies(id)}
          className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold transition ${
            actief === id ? 'bg-goud text-nacht' : 'text-paars-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Fout({ children }) {
  if (!children) return null
  return <p className="mt-2 rounded-lg bg-zegel/40 px-3 py-2 text-sm text-pink-100">{children}</p>
}

export function Laden() {
  return <p className="font-typemachine text-paars-300">Dossier wordt opgehaald…</p>
}
