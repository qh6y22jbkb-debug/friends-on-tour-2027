// Maakt de app-iconen en de deel-afbeelding (neutraal!) in public/.
import fs from 'node:fs'
import sharp from 'sharp'

const icoon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f5d68a"/><stop offset="1" stop-color="#c9971c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#1a0f2b"/>
  <rect x="88" y="150" width="336" height="224" rx="22" fill="none" stroke="url(#g)" stroke-width="22"/>
  <path d="M98 162 L256 290 L414 162" fill="none" stroke="url(#g)" stroke-width="22" stroke-linejoin="round"/>
  <circle cx="256" cy="300" r="62" fill="#7a1f3d" stroke="url(#g)" stroke-width="10"/>
  <text x="256" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="88" font-weight="700" fill="#f5d68a">?</text>
</svg>`

const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0b0710"/>
  <rect x="24" y="24" width="1152" height="582" rx="28" fill="#1a0f2b" stroke="#c9971c" stroke-width="4" stroke-dasharray="18 12"/>
  <text x="600" y="250" text-anchor="middle" font-family="Courier New, monospace" font-size="40" letter-spacing="10" fill="#c9971c">STRIKT GEHEIM</text>
  <text x="600" y="350" text-anchor="middle" font-family="Georgia, serif" font-size="84" font-weight="700" fill="#f5d68a">Een geheim weekend</text>
  <text x="600" y="430" text-anchor="middle" font-family="Courier New, monospace" font-size="32" fill="#b9a6d6">Operatie Mysterieweekend</text>
</svg>`

fs.writeFileSync('public/icoon.svg', icoon)
const svg = Buffer.from(icoon)
await sharp(svg).resize(192, 192).png().toFile('public/icoon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icoon-512.png')
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(Buffer.from(og)).png().toFile('public/deel-afbeelding.png')
console.log('✅ Iconen en deel-afbeelding gemaakt in public/')
