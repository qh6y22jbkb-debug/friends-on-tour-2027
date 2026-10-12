import { useState } from 'react'
import confetti from 'canvas-confetti'
import { fanfare, tromgeroffel } from '../lib/geluid.js'

const KLEUREN = ['#d4a72c', '#f5d68a', '#7a1f3d', '#ffffff', '#3d2463']

function feest() {
  const einde = Date.now() + 2500
  ;(function kanon() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: KLEUREN })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: KLEUREN })
    if (Date.now() < einde) requestAnimationFrame(kanon)
  })()
  confetti({ particleCount: 180, spread: 110, origin: { y: 0.45 }, colors: KLEUREN, scalar: 1.2 })
}

export default function Enveloppe({ data, onKlaar }) {
  // dicht -> roffel -> open
  const [fase, setFase] = useState('dicht')

  function openen() {
    if (fase !== 'dicht') return
    setFase('roffel')
    tromgeroffel()
    setTimeout(() => {
      setFase('open')
      fanfare()
      setTimeout(feest, 900)
    }, 1300)
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-nacht/95 px-6 backdrop-blur">
      <p className="label mb-6">{fase === 'open' ? 'Missie onthuld' : 'Strikt vertrouwelijk'}</p>

      <button
        onClick={openen}
        aria-label="Open de enveloppe"
        className={`relative h-56 w-80 max-w-full [perspective:800px] ${fase === 'roffel' ? 'schudden' : ''}`}
      >
        {/* Achterkant */}
        <div className="absolute inset-0 z-0 rounded-xl border-2 border-goud/60 bg-paars-950 shadow-2xl" />
        {/* De brief die eruit schuift */}
        <div
          className={`absolute inset-x-4 top-3 bottom-3 z-10 rounded-lg bg-[#f6eedc] p-4 text-left text-nacht ${
            fase === 'open' ? 'brief-uit' : ''
          }`}
        >
          {fase === 'open' && (
            <>
              <p className="font-typemachine text-[10px] tracking-[0.3em] text-zegel">BESTEMMING</p>
              <p className="mt-1 font-kop text-3xl leading-none font-black">{data?.bestemming}</p>
              <p className="mt-1 font-typemachine text-sm">{data?.land}</p>
            </>
          )}
        </div>
        {/* Voorkant: het vakje waar de brief in zit */}
        <div className="absolute inset-x-0 bottom-0 z-20 h-[62%] rounded-b-xl border-2 border-t-0 border-goud/60 bg-gradient-to-t from-paars-900 to-paars-700" />
        {/* De klep */}
        <div
          className={`absolute inset-x-0 top-0 h-1/2 origin-top [transform-style:preserve-3d] ${
            fase === 'open' ? 'flap-open z-0' : 'z-30'
          }`}
        >
          <div className="h-full w-full bg-gradient-to-b from-paars-700 to-paars-800 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          {fase !== 'open' && (
            <div className="absolute top-full left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-goud/70 bg-zegel font-kop text-2xl font-black text-goud-licht shadow-lg">
              ?
            </div>
          )}
        </div>
      </button>

      {fase === 'dicht' && <p className="mt-8 animate-pulse font-typemachine text-goud-licht">Tik op de enveloppe</p>}
      {fase === 'roffel' && <p className="mt-8 font-typemachine text-goud-licht">Tromgeroffel…</p>}
      {fase === 'open' && (
        <div className="binnenkomen mt-24 text-center [animation-delay:1.3s]">
          <h1 className="font-kop text-4xl font-black text-goud-licht">{data?.bestemming ?? 'Geheim'}</h1>
          {data?.slogan && <p className="mt-2 text-lg text-white">{data.slogan}</p>}
          <button className="knop mt-6 px-8 py-4 text-lg" onClick={onKlaar}>
            📁 Naar het dossier
          </button>
        </div>
      )}
    </div>
  )
}
