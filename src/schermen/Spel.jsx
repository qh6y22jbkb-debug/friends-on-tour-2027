import { useCallback, useEffect, useRef, useState } from 'react'
import { DAGMAX, PRIJS, nieuwRecord, record, stand, verdien } from '../lib/munten.js'
import { Knop, Kop } from '../ui.jsx'

// Spelwereld in vaste eenheden; het canvas schaalt mee met de schermbreedte.
const B = 360
const H = 520
const KOFFER = { x: 92, b: 40, h: 30 }
const ZWAARTEKRACHT = 1500
const SPRONG = -430
const PILAAR_B = 66
const AFSTAND = 220

function kleuren() {
  const css = getComputedStyle(document.documentElement)
  const v = (n) => css.getPropertyValue(n).trim()
  return { lucht: v('--accent-zacht'), wolk: v('--vlak'), wolkRand: v('--vlak-zacht'), tekst: v('--tekst') }
}

function nieuweWereld() {
  return { y: H * 0.42, v: 0, hoek: 0, pilaren: [], score: 0, tijd: 0, wolkjes: maakWolkjes() }
}

function maakWolkjes() {
  return Array.from({ length: 5 }, (_, i) => ({ x: i * 90 + Math.random() * 60, y: 40 + Math.random() * (H - 120), s: 0.6 + Math.random() * 0.6 }))
}

export default function Spel({ naam, terug, ga }) {
  const canvas = useRef(null)
  const wereld = useRef(nieuweWereld())
  const fase = useRef('wacht') // wacht | speelt | over
  const [scherm, setScherm] = useState('wacht')
  const [pot, setPot] = useState(() => stand(naam))
  const [laatste, setLaatste] = useState({ score: 0, punten: 0, record: false })
  const verdiendDezeRonde = useRef(0)

  const springen = useCallback(() => {
    if (fase.current === 'over') return
    if (fase.current === 'wacht') {
      wereld.current = nieuweWereld()
      verdiendDezeRonde.current = 0
      fase.current = 'speelt'
      setScherm('speelt')
    }
    wereld.current.v = SPRONG
  }, [])

  // Spellus
  useEffect(() => {
    const c = canvas.current
    const ctx = c.getContext('2d')
    let kleur = kleuren()
    const donker = window.matchMedia('(prefers-color-scheme: dark)')
    const wisselKleur = () => (kleur = kleuren())
    donker.addEventListener?.('change', wisselKleur)

    function maat() {
      const breedte = c.parentElement.clientWidth
      const dpr = window.devicePixelRatio || 1
      c.style.width = breedte + 'px'
      c.style.height = (breedte * H) / B + 'px'
      c.width = Math.round(breedte * dpr)
      c.height = Math.round(((breedte * H) / B) * dpr)
      ctx.setTransform((breedte / B) * dpr, 0, 0, (breedte / B) * dpr, 0, 0)
    }
    maat()
    window.addEventListener('resize', maat)

    let vorige = performance.now()
    let frame
    function stap(t) {
      const dt = Math.min(0.033, (t - vorige) / 1000)
      vorige = t
      const w = wereld.current
      if (fase.current === 'speelt') werk(w, dt)
      else if (fase.current === 'wacht') {
        w.tijd += dt
        w.y = H * 0.42 + Math.sin(w.tijd * 3) * 8
      }
      teken(ctx, w, kleur)
      frame = requestAnimationFrame(stap)
    }

    function werk(w, dt) {
      w.tijd += dt
      const snelheid = Math.min(230, 150 + w.tijd * 3)
      const gat = Math.max(128, 160 - w.tijd * 0.8)
      w.v += ZWAARTEKRACHT * dt
      w.y += w.v * dt
      w.hoek = Math.max(-0.45, Math.min(1.1, w.v / 600))
      for (const wk of w.wolkjes) {
        wk.x -= snelheid * 0.25 * wk.s * dt
        if (wk.x < -60) Object.assign(wk, { x: B + 40, y: 40 + Math.random() * (H - 120) })
      }
      const laatstePilaar = w.pilaren[w.pilaren.length - 1]
      if (!laatstePilaar || laatstePilaar.x < B - AFSTAND) {
        const marge = 70
        w.pilaren.push({ x: B + 10, gatY: marge + Math.random() * (H - 2 * marge - gat), gat, voorbij: false })
      }
      for (const p of w.pilaren) {
        p.x -= snelheid * dt
        if (!p.voorbij && p.x + PILAAR_B < KOFFER.x) {
          p.voorbij = true
          w.score++
          verdiendDezeRonde.current += verdien(naam, 1)
          setPot(stand(naam))
        }
      }
      w.pilaren = w.pilaren.filter((p) => p.x > -PILAAR_B - 10)
      if (botst(w)) gameOver(w)
    }

    function botst(w) {
      const k = { l: KOFFER.x - KOFFER.b / 2 + 4, r: KOFFER.x + KOFFER.b / 2 - 4, t: w.y - KOFFER.h / 2 + 3, o: w.y + KOFFER.h / 2 - 3 }
      if (k.t < 0 || k.o > H) return true
      return w.pilaren.some((p) => k.r > p.x && k.l < p.x + PILAAR_B && (k.t < p.gatY || k.o > p.gatY + p.gat))
    }

    function gameOver(w) {
      fase.current = 'over'
      const rec = nieuwRecord(naam, w.score)
      setLaatste({ score: w.score, punten: verdiendDezeRonde.current, record: rec })
      setScherm('over')
      setPot(stand(naam))
    }

    frame = requestAnimationFrame(stap)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', maat)
      donker.removeEventListener?.('change', wisselKleur)
    }
  }, [naam])

  useEffect(() => {
    const toets = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        springen()
      }
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [springen])

  function opnieuw() {
    wereld.current = nieuweWereld()
    fase.current = 'wacht'
    setScherm('wacht')
  }

  const vol = pot.vandaag >= DAGMAX

  return (
    <>
      <Kop titel="Vliegende koffer" terug={terug} />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-vlak p-4">
          <p className="text-sm text-tekst-zacht">Spaarpot</p>
          <p className="text-2xl font-extrabold tabular-nums">
            {pot.bank}
            <span className="text-base font-semibold text-tekst-zacht">/{PRIJS}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-vlak-zacht">
            <div className="balk h-full w-full rounded-full bg-accent" style={{ transform: `scaleX(${Math.min(1, pot.bank / PRIJS)})` }} />
          </div>
        </div>
        <div className="rounded-[24px] bg-vlak p-4">
          <p className="text-sm text-tekst-zacht">Vandaag verdiend</p>
          <p className="text-2xl font-extrabold tabular-nums">
            {pot.vandaag}
            <span className="text-base font-semibold text-tekst-zacht">/{DAGMAX}</span>
          </p>
          <p className="mt-1 text-xs text-tekst-zacht">Record: {record(naam)}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] select-none" style={{ touchAction: 'manipulation' }}>
        <canvas
          ref={canvas}
          onPointerDown={(e) => {
            e.preventDefault()
            springen()
          }}
          className="block"
          aria-label="Speelveld: tik om de koffer te laten vliegen"
        />
        {scherm === 'wacht' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 text-center">
            <p className="inline-block rounded-full bg-vlak px-5 py-2 font-semibold shadow-sm">Tik om te vliegen</p>
            {vol && <p className="mt-2 text-sm font-medium">Je 50 punten voor vandaag zijn binnen. Spelen mag, sparen weer morgen.</p>}
          </div>
        )}
        {scherm === 'over' && (
          <div className="opkomen absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-6">
            <div className="w-full max-w-xs rounded-[28px] bg-vlak p-6 text-center">
              <p className="text-sm text-tekst-zacht">{laatste.record ? 'Nieuw record!' : 'Neergestort'}</p>
              <p className="text-5xl font-extrabold tabular-nums">{laatste.score}</p>
              <p className="mt-1 text-tekst-zacht">
                {laatste.punten > 0 ? `+${laatste.punten} ${laatste.punten === 1 ? 'punt' : 'punten'} in je spaarpot` : vol ? 'Daglimiet bereikt, geen punten erbij' : 'Geen punten deze keer'}
              </p>
              <Knop className="mt-5 w-full" onClick={opnieuw}>
                Nog een keer
              </Knop>
              {pot.bank >= PRIJS && (
                <Knop variant="rand" className="mt-2 w-full" onClick={() => ga({ scherm: { soort: 'hints' } })}>
                  Koop een schatkist
                </Knop>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-tekst-zacht">
        Elke wolk die je passeert is 1 punt. Maximaal {DAGMAX} per dag. Bij {PRIJS} punten koop je een schatkist naar keuze.
      </p>
    </>
  )
}

/* ---------- Tekenen ---------- */

function rond(ctx, x, y, b, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, b, h, r)
  ctx.fill()
}

function wolkPilaar(ctx, p, kleur) {
  ctx.fillStyle = kleur.wolk
  // Bovenste en onderste pilaar, met bolle wolkranden rond het gat.
  rond(ctx, p.x, -20, PILAAR_B, p.gatY + 20, 18)
  rond(ctx, p.x, p.gatY + p.gat, PILAAR_B, H - p.gatY - p.gat + 20, 18)
  for (const [cy, richting] of [
    [p.gatY, -1],
    [p.gatY + p.gat, 1],
  ]) {
    for (const dx of [10, 33, 56]) {
      ctx.beginPath()
      ctx.arc(p.x + dx, cy + richting * 6, 14, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.fillStyle = kleur.wolkRand
  ctx.fillRect(p.x + PILAAR_B - 8, -20, 8, p.gatY + 6)
  ctx.fillRect(p.x + PILAAR_B - 8, p.gatY + p.gat - 6, 8, H)
}

function koffer(ctx, w) {
  ctx.save()
  ctx.translate(KOFFER.x, w.y)
  ctx.rotate(w.hoek)
  // handvat
  ctx.strokeStyle = '#5e3729'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(-8, -KOFFER.h / 2 - 9, 16, 12, 5)
  ctx.stroke()
  // koffer
  ctx.fillStyle = '#f2bc4b'
  rond(ctx, -KOFFER.b / 2, -KOFFER.h / 2, KOFFER.b, KOFFER.h, 7)
  ctx.fillStyle = '#c9902a'
  ctx.fillRect(-KOFFER.b / 2 + 9, -KOFFER.h / 2, 5, KOFFER.h)
  ctx.fillRect(KOFFER.b / 2 - 14, -KOFFER.h / 2, 5, KOFFER.h)
  ctx.restore()
}

function teken(ctx, w, kleur) {
  ctx.fillStyle = kleur.lucht
  ctx.fillRect(0, 0, B, H)
  ctx.globalAlpha = 0.6
  ctx.fillStyle = kleur.wolk
  for (const wk of w.wolkjes) {
    for (const [dx, r] of [
      [0, 12],
      [14, 16],
      [30, 11],
    ]) {
      ctx.beginPath()
      ctx.arc(wk.x + dx * wk.s, wk.y, r * wk.s, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  for (const p of w.pilaren) wolkPilaar(ctx, p, kleur)
  koffer(ctx, w)
  ctx.fillStyle = kleur.tekst
  ctx.font = '800 44px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(w.score), B / 2, 70)
}
