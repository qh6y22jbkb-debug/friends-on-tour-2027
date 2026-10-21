// Maakt src/kluis.json: de geheime inhoud, versleuteld, zodat hij veilig in de app kan.
// Draait automatisch vóór `npm run dev` en `npm run build`.
//
// Werking: elke tegel krijgt een eigen willekeurige sleutel (AES-GCM, 256 bit).
// Die sleutel wordt "ingepakt" met het tegelwachtwoord én met het organisatorwachtwoord
// (beide via PBKDF2). Zonder wachtwoord is de inhoud niet te lezen, ook niet in de broncode.
import fs from 'node:fs'
import crypto from 'node:crypto'

const { subtle } = globalThis.crypto
const RONDES = 310_000
const UIT = 'src/kluis.json'
const CODES = 'secret/codes.json'

function leesGeheim(naam) {
  const echt = `secret/${naam}.json`
  if (fs.existsSync(echt)) return JSON.parse(fs.readFileSync(echt, 'utf8'))
  console.warn(`⚠️  ${echt} ontbreekt, ik gebruik de nepdata uit secret/${naam}.example.json.`)
  return JSON.parse(fs.readFileSync(`secret/${naam}.example.json`, 'utf8'))
}

const content = leesGeheim('content')
const hints = leesGeheim('hints')

let codes = fs.existsSync(CODES) ? JSON.parse(fs.readFileSync(CODES, 'utf8')) : {}
if (!codes.organisatorWachtwoord) {
  codes = { organisatorWachtwoord: crypto.randomBytes(9).toString('base64url') }
  fs.writeFileSync(CODES, JSON.stringify(codes, null, 2) + '\n')
  console.log(`🔑 Organisatorwachtwoord aangemaakt in ${CODES}.`)
}

const b64 = (buf) => Buffer.from(buf).toString('base64')
const normaal = (pw) => String(pw).trim().toLowerCase()

async function afgeleid(wachtwoord, salt) {
  const basis = await subtle.importKey('raw', new TextEncoder().encode(wachtwoord), 'PBKDF2', false, ['deriveKey'])
  return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: RONDES }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
}

async function sluit(sleutel, bytes) {
  const iv = crypto.randomBytes(12)
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, sleutel, bytes)
  return { iv: b64(iv), ct: b64(ct) }
}

// Welke wachtwoorden openen welke tegel (organisator opent altijd alles).
const tegels = {
  bestemming: { inhoud: content.bestemming, wachtwoord: 'bestemming' },
  praktisch: { inhoud: content.praktisch, wachtwoord: 'bestemming' },
  organisatie: { inhoud: content.organisatie, wachtwoord: null },
  ...Object.fromEntries(content.dagen.map((d) => [d.id, { inhoud: d, wachtwoord: d.id }])),
}

const ontbrekend = [...new Set(Object.values(tegels).map((t) => t.wachtwoord).filter(Boolean))].filter(
  (id) => !content.wachtwoorden?.[id],
)
if (ontbrekend.length) {
  console.error(`✋ Geen wachtwoord voor: ${ontbrekend.join(', ')} (zie "wachtwoorden" in content.json)`)
  process.exit(1)
}

// Hints staan niet leesbaar in de app. De sleutel volgt uit de datum: niet waterdicht
// (zonder server kan dat niet), maar je kunt ze niet meer gewoon in de broncode lezen.
async function hintSleutel(datum) {
  const ruw = await subtle.digest('SHA-256', new TextEncoder().encode('fot-hint:' + datum))
  return subtle.importKey('raw', ruw, 'AES-GCM', false, ['encrypt'])
}
async function versleutelHints(lijst) {
  const uit = []
  for (const h of lijst) uit.push({ datum: h.datum, ...(await sluit(await hintSleutel(h.datum), new TextEncoder().encode(h.tekst))) })
  return uit
}

const orgSalt = crypto.randomBytes(16)
const orgSleutel = await afgeleid(normaal(codes.organisatorWachtwoord), orgSalt)
const kluis = {
  rondes: RONDES,
  publiek: { dagen: content.dagen.map((d) => ({ id: d.id, datum: d.datum })) },
  hints: await versleutelHints(hints),
  org: { salt: b64(orgSalt), controle: await sluit(orgSleutel, new TextEncoder().encode('ok')) },
  tegels: {},
}

for (const [id, tegel] of Object.entries(tegels)) {
  const ruw = crypto.randomBytes(32)
  const tegelSleutel = await subtle.importKey('raw', ruw, 'AES-GCM', false, ['encrypt'])
  const item = {
    data: await sluit(tegelSleutel, new TextEncoder().encode(JSON.stringify(tegel.inhoud))),
    viaOrg: await sluit(orgSleutel, ruw),
  }
  if (tegel.wachtwoord) {
    const salt = crypto.randomBytes(16)
    item.salt = b64(salt)
    item.viaWachtwoord = await sluit(await afgeleid(normaal(content.wachtwoorden[tegel.wachtwoord]), salt), ruw)
  }
  kluis.tegels[id] = item
}

// Inlogwachtwoorden van deelnemers: alleen een PBKDF2-hash met salt, nooit het wachtwoord zelf.
kluis.login = {}
for (const [naam, wachtwoord] of Object.entries(codes.deelnemerWachtwoorden ?? {})) {
  const salt = crypto.randomBytes(16)
  const basis = await subtle.importKey('raw', new TextEncoder().encode(normaal(wachtwoord)), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: RONDES }, basis, 256)
  kluis.login[naam] = { salt: b64(salt), hash: b64(bits) }
}

fs.writeFileSync(UIT, JSON.stringify(kluis))
console.log(`🔒 ${UIT} gemaakt (${Object.keys(kluis.tegels).length} tegels versleuteld, ${hints.length} hints).`)
