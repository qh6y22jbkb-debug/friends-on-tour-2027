// Zet de geheime data klaar voor de Worker.
//   node scripts/geheim.mjs lokaal  -> schrijft .dev.vars voor `npm run worker`
//   node scripts/geheim.mjs upload  -> uploadt de geheimen naar Cloudflare (wrangler secret put)
import fs from 'node:fs'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const modus = process.argv[2]
const REVEAL = 'secret/reveal.json'
const VOORBEELD = 'secret/reveal.example.json'
const CODES = 'secret/codes.json'

if (!['lokaal', 'upload'].includes(modus)) {
  console.log('Gebruik: node scripts/geheim.mjs lokaal|upload')
  process.exit(1)
}

let revealPad = REVEAL
if (!fs.existsSync(REVEAL)) {
  if (modus === 'upload') {
    console.error(`✋ ${REVEAL} bestaat niet. Kopieer ${VOORBEELD} en vul de echte gegevens in.`)
    process.exit(1)
  }
  console.warn(`⚠️  ${REVEAL} ontbreekt, ik gebruik voorlopig de nepdata uit ${VOORBEELD}.`)
  revealPad = VOORBEELD
}

if (!fs.existsSync(CODES)) {
  const woord = () => crypto.randomBytes(3).toString('hex')
  fs.writeFileSync(
    CODES,
    JSON.stringify(
      {
        organisatorCode: `baas-${woord()}-${woord()}`,
        groepscode: 'geheimagent',
        testTijd: '',
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`🔑 ${CODES} aangemaakt met een willekeurige organisatorcode. Pas aan als je wilt.`)
}

const codes = JSON.parse(fs.readFileSync(CODES, 'utf8'))
const reveal = fs.readFileSync(revealPad, 'utf8')
JSON.parse(reveal) // geeft een duidelijke fout als de JSON stuk is

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex')
const geheimen = {
  REVEAL_B64: Buffer.from(reveal, 'utf8').toString('base64'),
  ORG_HASH: sha256('omw-org:' + String(codes.organisatorCode).trim()),
  GROEP_HASH: sha256('omw-groep:' + String(codes.groepscode).trim().toLowerCase()),
}

if (modus === 'lokaal') {
  const regels = Object.entries(geheimen).map(([k, v]) => `${k}="${v}"`)
  regels.unshift('DEV="1"')
  if (codes.testTijd) regels.push(`NU_OVERRIDE="${codes.testTijd}"`)
  fs.writeFileSync('.dev.vars', regels.join('\n') + '\n')
  console.log('✅ .dev.vars geschreven. Start nu `npm run worker` (en in een tweede terminal `npm run dev`).')
  if (codes.testTijd) console.log(`🕰️  Lokale servertijd staat op ${codes.testTijd}`)
} else {
  for (const [naam, waarde] of Object.entries(geheimen)) {
    console.log(`⬆️  ${naam} uploaden…`)
    const r = spawnSync('npx', ['wrangler', 'secret', 'put', naam], {
      input: waarde,
      stdio: ['pipe', 'inherit', 'inherit'],
    })
    if (r.status !== 0) process.exit(r.status ?? 1)
  }
  console.log('✅ Geheimen staan in de kluis van Cloudflare.')
}
