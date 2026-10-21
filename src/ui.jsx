import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, ExternalLink, Lock } from 'lucide-react'
import { persoon } from './config.js'
import { minderBeweging } from './lib/overgang.js'

/* ---------- Schermopbouw ---------- */

// Hoofdscherm: grote titel. Subscherm: ronde terugknop met de titel in het midden.
export function Kop({ titel, sub, terug }) {
  if (terug) {
    return (
      <header className="mb-6">
        <div className="grid grid-cols-[48px_1fr_48px] items-center">
          <button
            type="button"
            onClick={terug}
            aria-label="Terug"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-vlak transition-transform duration-150 active:scale-95"
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
          <h1 className="truncate px-2 text-center text-lg font-semibold">{titel}</h1>
        </div>
        {sub && <p className="mt-3 text-center text-tekst-zacht">{sub}</p>}
      </header>
    )
  }
  return (
    <header className="mb-6">
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">{titel}</h1>
      {sub && <p className="mt-1 text-tekst-zacht">{sub}</p>}
    </header>
  )
}

export function Sectiekop({ titel, actie }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-xl font-bold tracking-tight">{titel}</h2>
      {actie}
    </div>
  )
}

export function Blok({ titel, children, actie }) {
  return (
    <section className="mb-6">
      {(titel || actie) && <Sectiekop titel={titel} actie={actie} />}
      <div className="overflow-hidden rounded-[28px] bg-vlak">{children}</div>
    </section>
  )
}

// Profielfoto in een rondje; zonder foto (of als hij niet laadt) de eerste letter.
export function Avatar({ naam, maat = 40, className = '' }) {
  const [mislukt, setMislukt] = useState(false)
  const foto = persoon(naam)?.foto
  const stijl = { width: maat, height: maat }
  if (foto && !mislukt) {
    return (
      <img
        src={import.meta.env.BASE_URL + foto}
        alt=""
        aria-hidden="true"
        width={maat}
        height={maat}
        loading="lazy"
        onError={() => setMislukt(true)}
        style={stijl}
        className={`shrink-0 rounded-full bg-vlak-zacht object-cover ${className}`}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...stijl, fontSize: maat * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-op-accent ${className}`}
    >
      {naam?.[0]}
    </span>
  )
}

export function Rondje({ children, className = '' }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vlak-zacht ${className}`}>
      {children}
    </span>
  )
}

// Een rij in een lijst; klikbaar als er een onClick is.
export function Rij({ icoon: Icoon, voor, titel, sub, rechts, onClick, i = 0, pijl = !!onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{ '--i': i }}
      className="opkomen flex min-h-16 w-full items-center gap-3 border-b border-rand px-5 py-3 text-left last:border-b-0 active:bg-vlak-zacht/50"
    >
      {voor ??
        (Icoon && (
          <Rondje>
            <Icoon size={19} strokeWidth={1.75} />
          </Rondje>
        ))}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{titel}</span>
        {sub && <span className="block text-sm text-tekst-zacht">{sub}</span>}
      </span>
      {rechts}
      {pijl && <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-tekst-zacht" />}
    </Tag>
  )
}

// Label/tekst-regels met optionele link, zoals in de content.json.
export function Regels({ regels = [] }) {
  return regels.map((r, i) => (
    <div key={i} style={{ '--i': i }} className="opkomen border-b border-rand px-5 py-3.5 last:border-b-0">
      <p className="text-sm text-tekst-zacht">{r.label}</p>
      <p className="font-medium">
        {r.tekst}
        {r.link && <Link href={r.link} />}
      </p>
    </div>
  ))
}

export function Link({ href, children = 'Openen' }) {
  if (!/^https?:\/\//.test(href || '')) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="ml-2 inline-flex items-center gap-1 font-semibold underline decoration-accent decoration-2 underline-offset-4"
    >
      {children} <ExternalLink size={14} strokeWidth={2} />
    </a>
  )
}

// Klein wit labeltje, zoals "Personal" in het ontwerp.
export function Chip({ children, slot, className = 'bg-vlak' }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${className}`}>
      {slot && <Lock size={12} strokeWidth={2.25} />}
      {children}
    </span>
  )
}

/* ---------- Tegels ---------- */

const TINTEN = {
  roze: 'bg-tint-roze',
  lila: 'bg-tint-lila',
  salie: 'bg-tint-salie',
  zand: 'bg-tint-zand',
  wit: 'bg-vlak',
}

export function Tegel({ icoon: Icoon, titel, sub, voet, slot, onClick, i = 0, breed, tint = 'wit' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ '--i': i }}
      className={`opkomen flex min-h-36 flex-col items-start rounded-[24px] p-4 text-left transition-transform duration-150 active:scale-[0.98] ${
        TINTEN[tint]
      } ${breed ? 'col-span-2' : ''}`}
    >
      {Icoon && <Icoon size={22} strokeWidth={1.75} />}
      <span className="mt-3 font-semibold">{titel}</span>
      {sub && <span className="text-sm leading-snug text-tekst-zacht">{sub}</span>}
      <span className="mt-auto flex w-full items-center justify-between gap-2 pt-3">
        <span className="text-xs whitespace-nowrap text-tekst-zacht">{voet}</span>
        <Chip slot={slot}>{slot ? 'Op slot' : 'Open'}</Chip>
      </span>
    </button>
  )
}

/* ---------- Invoer ---------- */

export function Knop({ children, variant = 'vol', className = '', ...rest }) {
  const stijl =
    variant === 'vol' ? 'bg-accent text-op-accent' : variant === 'rand' ? 'bg-vlak text-tekst' : 'text-tekst underline decoration-accent decoration-2 underline-offset-4'
  return (
    <button
      className={`flex min-h-14 items-center justify-center gap-2 rounded-full px-6 font-semibold transition-transform duration-150 active:scale-[0.98] disabled:opacity-40 ${stijl} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Veld({ label, ...rest }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-tekst-zacht">{label}</span>}
      <input
        className="min-h-14 w-full rounded-2xl border-2 border-transparent bg-vlak px-4 text-base outline-none focus:border-accent"
        {...rest}
      />
    </label>
  )
}

export function Fout({ children }) {
  if (!children) return null
  return <p className="mt-2 text-sm font-medium text-fout">{children}</p>
}

// Afvinkbare rij: rond vinkje springt in, tekst wordt doorgehaald.
export function Vinkrij({ aan, onWissel, titel, sub, i = 0 }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={aan}
      onClick={onWissel}
      style={{ '--i': i }}
      className="opkomen flex min-h-14 w-full items-center gap-3 border-b border-rand px-5 py-3 text-left last:border-b-0 active:bg-vlak-zacht/50"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          aan ? 'border-accent bg-accent text-op-accent' : 'border-vlak-zacht'
        }`}
      >
        {aan && <Check size={14} strokeWidth={3} className="vinkje" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="doorhaal inline" data-aan={aan}>
          {titel}
        </span>
        {sub && <span className="block text-sm text-tekst-zacht">{sub}</span>}
      </span>
    </button>
  )
}

/* ---------- Animerende waarden ---------- */

export function Voortgang({ waarde, totaal }) {
  const deel = totaal ? waarde / totaal : 0
  return (
    <div className="h-3 overflow-hidden rounded-full bg-vlak-zacht">
      <div className="balk h-full w-full rounded-full bg-accent" style={{ transform: `scaleX(${deel})` }} />
    </div>
  )
}

// Telt soepel naar een nieuw getal.
export function Teller({ waarde, opmaak = (n) => Math.round(n) }) {
  const [getoond, setGetoond] = useState(waarde)
  const vorige = useRef(waarde)
  useEffect(() => {
    const van = vorige.current
    vorige.current = waarde
    if (van === waarde || minderBeweging() || document.hidden) {
      setGetoond(waarde)
      return
    }
    const start = performance.now()
    let frame
    const stap = (t) => {
      const p = Math.min(1, (t - start) / 500)
      const ease = 1 - Math.pow(1 - p, 3)
      setGetoond(van + (waarde - van) * ease)
      if (p < 1) frame = requestAnimationFrame(stap)
    }
    frame = requestAnimationFrame(stap)
    // Vangnet: als animatieframes stilliggen, toch op de eindwaarde uitkomen.
    const vangnet = setTimeout(() => setGetoond(waarde), 650)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(vangnet)
    }
  }, [waarde])
  return <span className="tabular-nums">{opmaak(getoond)}</span>
}

/* ---------- Bottom sheet ---------- */

export function Sheet({ open, onSluit, titel, children }) {
  const [zichtbaar, setZichtbaar] = useState(open)
  const [binnen, setBinnen] = useState(false)

  useEffect(() => {
    if (open) {
      setZichtbaar(true)
      // Even wachten zodat de beginstand getekend is; een timer werkt ook als animatieframes stilliggen.
      const t = setTimeout(() => setBinnen(true), 20)
      return () => clearTimeout(t)
    }
    setBinnen(false)
    const t = setTimeout(() => setZichtbaar(false), 300)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onSluit])

  if (!zichtbaar) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={titel}>
      <div
        className="sheet-achter absolute inset-0 bg-black/40"
        style={{ opacity: binnen ? 1 : 0 }}
        onClick={onSluit}
      />
      <div
        className="sheet-paneel relative w-full max-w-md rounded-t-[32px] bg-achtergrond px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
        style={{ transform: binnen ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-vlak-zacht" />
        {titel && <h2 className="mb-4 text-xl font-bold">{titel}</h2>}
        {children}
      </div>
    </div>
  )
}
