// Maakt de app-iconen en de deel-afbeelding (neutraal) in public/.
import fs from 'node:fs'
import sharp from 'sharp'

const ACCENT = '#f2bc4b'

// Eenvoudige koffer als lijn-icoon.
const icoon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${ACCENT}"/>
  <g fill="none" stroke="#1f1e1c" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <rect x="136" y="176" width="240" height="200" rx="28"/>
    <path d="M208 176v-28a20 20 0 0 1 20-20h56a20 20 0 0 1 20 20v28"/>
    <path d="M208 236v80M304 236v80"/>
  </g>
</svg>`

const deel = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f0eeea"/>
  <g transform="translate(120 205) scale(0.43)">${icoon.replace(/<\/?svg[^>]*>/g, '')}</g>
  <text x="380" y="300" font-family="Helvetica, Arial, sans-serif" font-size="76" font-weight="600" fill="#1f1e1c">Friends on Tour 2027</text>
  <text x="382" y="365" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#6f6a62">Een weekend weg met z'n vijven.</text>
</svg>`

fs.writeFileSync('public/icoon.svg', icoon)
const svg = Buffer.from(icoon)
await sharp(svg).resize(192, 192).png().toFile('public/icoon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icoon-512.png')
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(Buffer.from(deel)).png().toFile('public/deel-afbeelding.png')
console.log('✅ Iconen en deel-afbeelding gemaakt in public/')
