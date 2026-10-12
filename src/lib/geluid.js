// Geluidjes met Web Audio, zodat er geen audiobestanden nodig zijn.
let ctx
function context() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function toon(freq, start, duur, type = 'triangle', volume = 0.18) {
  const c = context()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, c.currentTime + start)
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duur)
  osc.connect(gain).connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + duur + 0.05)
}

function roffel(duur) {
  const c = context()
  const buffer = c.createBuffer(1, c.sampleRate * duur, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const tik = Math.floor((i / c.sampleRate) * 28) % 2 === 0 ? 1 : 0.35
    data[i] = (Math.random() * 2 - 1) * tik * (0.3 + (0.7 * i) / data.length)
  }
  const bron = c.createBufferSource()
  const filter = c.createBiquadFilter()
  const gain = c.createGain()
  filter.type = 'bandpass'
  filter.frequency.value = 900
  gain.gain.value = 0.25
  bron.buffer = buffer
  bron.connect(filter).connect(gain).connect(c.destination)
  bron.start()
}

export function tromgeroffel() {
  try {
    roffel(1.2)
  } catch {
    /* geen geluid, geen drama */
  }
}

export function fanfare() {
  try {
    const noten = [523.25, 659.25, 783.99, 1046.5]
    noten.forEach((f, i) => toon(f, i * 0.13, 0.3, 'square', 0.08))
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f) => toon(f, 0.6, 1.4, 'triangle', 0.12))
  } catch {
    /* idem */
  }
}

export function klik() {
  try {
    toon(880, 0, 0.06, 'square', 0.05)
  } catch {
    /* idem */
  }
}
