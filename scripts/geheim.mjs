// Zet de geheime inhoud klaar voor de Worker.
//   node scripts/geheim.mjs lokaal  -> schrijft .dev.vars voor `npm run worker`
//   node scripts/geheim.mjs upload  -> uploadt de geheimen naar Cloudflare (wrangler secret put)
// Tegelwachtwoorden worden hier al gehasht; de Worker krijgt ze nooit leesbaar.
import fs from 'node:fs'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const modus = process.argv[2]
const CODES = 'secret/codes.json'

if (!['lokaal', 'upload'].includes(modus)) {
  console.log('Gebruik: node scripts/geheim.mjs lokaal|upload')
  process.exit(1)
}

function leesGeheim(naam) {
  const echt = `secret/${naam}.json`
  const voorbeeld = `secret/${naam}.example.json`
  if (fs.existsSync(echt)) return JSON.parse(fs.readFileSync(echt, 'utf8'))
  if (modus === 'upload') {
    console.error(`✋ ${echt} bestaat niet. Kopieer ${voorbeeld} en vul de echte gegevens in.`)
    process.exit(1)
  }
  console.warn(`⚠️  ${echt} ontbreekt, ik gebruik voorlopig de nepdata uit ${voorbeeld}.`)
  return JSON.parse(fs.readFileSync(voorbeeld, 'utf8'))
}

const content = leesGeheim('content')
const hints = leesGeheim('hints')

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex')
const ontbrekend = ['bestemming', ...content.dagen.map((d) => d.id)].filter((id) => !content.wachtwoorden?.[id])
if (ontbrekend.length) {
  console.error(`✋ Geen wachtwoord ingesteld voor: ${ontbrekend.join(', ')} (zie "wachtwoorden" in content.json)`)
  process.exit(1)
}
const veilig = {
  ...content,
  wachtwoorden: Object.fromEntries(
    Object.entries(content.wachtwoorden).map(([id, pw]) => [id, sha256(`fot-tegel:${id}:${String(pw).trim().toLowerCase()}`)]),
  ),
}

let codes = fs.existsSync(CODES) ? JSON.parse(fs.readFileSync(CODES, 'utf8')) : {}
if (!codes.sessieGeheim) {
  codes = { sessieGeheim: crypto.randomBytes(32).toString('hex'), testTijd: codes.testTijd ?? '' }
  fs.writeFileSync(CODES, JSON.stringify(codes, null, 2) + '\n')
  console.log(`🔑 ${CODES} bijgewerkt met een nieuw sessiegeheim.`)
}

const b64 = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64')
const geheimen = {
  CONTENT_B64: b64(veilig),
  HINTS_B64: b64(hints),
  SESSIE_GEHEIM: codes.sessieGeheim,
}

if (modus === 'lokaal') {
  const regels = ['DEV="1"', ...Object.entries(geheimen).map(([k, v]) => `${k}="${v}"`)]
  if (codes.testTijd) regels.push(`NU_OVERRIDE="${codes.testTijd}"`)
  fs.writeFileSync('.dev.vars', regels.join('\n') + '\n')
  console.log('✅ .dev.vars geschreven. Herstart `npm run worker` om het te laden.')
  if (codes.testTijd) console.log(`🕰️  Testmodus: lokale servertijd staat op ${codes.testTijd}`)
} else {
  for (const [naam, waarde] of Object.entries(geheimen)) {
    console.log(`⬆️  ${naam} uploaden…`)
    const r = spawnSync('npx', ['wrangler', 'secret', 'put', naam], { input: waarde, stdio: ['pipe', 'inherit', 'inherit'] })
    if (r.status !== 0) process.exit(r.status ?? 1)
  }
  console.log('✅ Geheimen staan op Cloudflare.')
}
