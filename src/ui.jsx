import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, ExternalLink, Lock } from 'lucide-react'
import { minderBeweging } from './lib/overgang.js'

/* ---------- Schermopbouw ---------- */

export function Kop({ titel, sub, terug }) {
  return (
    <header className="mb-6">
      {terug && (
        <button
          onClick={terug}
          className="-ml-2 mb-2 flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-tekst-zacht active:bg-vlak-zacht"
        >
          <ChevronLeft size={18} strokeWidth={1.75} /> Terug
        </button>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{titel}</h1>
      {sub && <p className="mt-1 text-tekst-zacht">{sub}</p>}
    </header>
  )
}

export function Blok({ titel, children, actie }) {
  return (
    <section className="mb-6">
      {(titel || actie) && (
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold tracking-wide text-tekst-zacht uppercase">{titel}</h2>
          {actie}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-rand bg-vlak">{children}</div>
    </section>
  )
}

// Een rij in een lijst; klikbaar als er een onClick is.
export function Rij({ icoon: Icoon, titel, sub, rechts, onClick, i = 0, pijl = !!onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      style={{ '--i': i }}
      className="opkomen flex min-h-12 w-full items-center gap-3 border-b border-rand px-4 py-3 text-left last:border-b-0 active:bg-vlak-zacht"
    >
      {Icoon && <Icoon size={20} strokeWidth={1.75} className="shrink-0 text-tekst-zacht" />}
      <span className="min-w-0 flex-1">
        <span className="block">{titel}</span>
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
    <div key={i} style={{ '--i': i }} className="opkomen border-b border-rand px-4 py-3 last:border-b-0">
      <p className="text-sm text-tekst-zacht">{r.label}</p>
      <p>
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
      className="ml-2 inline-flex items-center gap-1 font-medium text-accent underline-offset-2 hover:underline"
    >
      {children} <ExternalLink size={14} strokeWidth={1.75} />
    </a>
  )
}

/* ---------- Tegels ---------- */

export function Tegel({ icoon: Icoon, titel, sub, slot, onClick, i = 0, breed }) {
  return (
    <button
      onClick={onClick}
      style={{ '--i': i }}
      className={`opkomen flex min-h-28 flex-col items-start rounded-xl border border-rand bg-vlak p-4 text-left transition-transform duration-150 active:scale-[0.98] ${
        breed ? 'col-span-2' : ''
      }`}
    >
      <span className="flex w-full items-center justify-between">
        <Icoon size={22} strokeWidth={1.75} className="text-accent" />
        {slot && <Lock size={16} strokeWidth={1.75} className="text-tekst-zacht" aria-label="Vergrendeld" />}
      </span>
      <span className="mt-auto pt-4 font-medium">{titel}</span>
      {sub && <span className="text-sm text-tekst-zacht">{sub}</span>}
    </button>
  )
}

/* ---------- Invoer ---------- */

export function Knop({ children, variant = 'vol', className = '', ...rest }) {
  const stijl =
    variant === 'vol'
      ? 'bg-accent text-op-accent'
      : variant === 'rand'
        ? 'border border-rand bg-vlak text-tekst'
        : 'text-accent'
  return (
    <button
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-medium transition-transform duration-150 active:scale-[0.98] disabled:opacity-40 ${stijl} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Veld({ label, ...rest }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-tekst-zacht">{label}</span>}
      <input
        className="min-h-11 w-full rounded-lg border border-rand bg-vlak px-3 text-base outline-none focus:border-accent"
        {...rest}
      />
    </label>
  )
}

export function Fout({ children }) {
  if (!children) return null
  return <p className="mt-2 text-sm text-fout">{children}</p>
}

export function Laden() {
  return <p className="py-8 text-center text-tekst-zacht">Laden…</p>
}

// Afvinkbare rij: vinkje springt in, tekst wordt doorgehaald.
export function Vinkrij({ aan, onWissel, titel, sub, i = 0 }) {
  return (
    <button
      role="checkbox"
      aria-checked={aan}
      onClick={onWissel}
      style={{ '--i': i }}
      className="opkomen flex min-h-12 w-full items-center gap-3 border-b border-rand px-4 py-3 text-left last:border-b-0 active:bg-vlak-zacht"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-200 ${
          aan ? 'border-accent bg-accent text-op-accent' : 'border-rand'
        }`}
      >
        {aan && <Check size={14} strokeWidth={2.5} className="vinkje" />}
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
    <div className="h-1.5 overflow-hidden rounded-full bg-vlak-zacht">
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
        className="sheet-paneel relative w-full max-w-md rounded-t-2xl border border-b-0 border-rand bg-vlak px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
        style={{ transform: binnen ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-rand" />
        {titel && <h2 className="mb-4 text-lg font-semibold">{titel}</h2>}
        {children}
      </div>
    </div>
  )
}
