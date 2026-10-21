// Maakt van de originele foto's in "Profielfoto's/" kleine vierkante profielfoto's in public/profiel/.
// Per persoon: waar het gezicht zit (x, y als deel van breedte/hoogte) en hoe ver ingezoomd wordt.
import fs from 'node:fs'
import sharp from 'sharp'

const BRON = "Profielfoto's"
const DOEL = 'public/profiel'
const MAAT = 256

const FOTOS = {
  Tico: { bestand: 'Tico.jpg', x: 0.6, y: 0.33, zoom: 0.55 },
  Bouke: { bestand: 'Bouke.jpg', x: 0.47, y: 0.33, zoom: 0.32 },
  Marco: { bestand: 'Marco.jpg', x: 0.46, y: 0.41, zoom: 0.45 },
  Thomas: { bestand: 'Thomas.jpg', x: 0.46, y: 0.43, zoom: 0.5 },
  Jop: { bestand: 'Jop.PNG', x: 0.44, y: 0.2, zoom: 0.5 },
}

fs.mkdirSync(DOEL, { recursive: true })
for (const [naam, f] of Object.entries(FOTOS)) {
  const pad = `${BRON}/${f.bestand}`
  if (!fs.existsSync(pad)) {
    console.warn(`⚠️  ${pad} ontbreekt, ${naam} krijgt een letter.`)
    continue
  }
  const beeld = sharp(pad).rotate()
  const { width, height } = await beeld.metadata()
  const zijde = Math.round(Math.min(width, height) * f.zoom)
  const left = Math.min(Math.max(0, Math.round(width * f.x - zijde / 2)), width - zijde)
  const top = Math.min(Math.max(0, Math.round(height * f.y - zijde / 2)), height - zijde)
  // sharp neemt standaard geen metadata (zoals locatie) mee.
  await beeld
    .extract({ left, top, width: zijde, height: zijde })
    .resize(MAAT, MAAT)
    .webp({ quality: 82 })
    .toFile(`${DOEL}/${naam.toLowerCase()}.webp`)
  console.log(`✅ ${naam}`)
}
