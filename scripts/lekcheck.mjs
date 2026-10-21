// Zoekt in de repo (en de build) naar woorden die de verrassing kunnen verraden.
// De verboden woorden komen ALLEEN uit bestanden die niet in git staan:
//   - secret/content.json  (plaats, regio, naam + adres verblijf)
//   - secret/lekwoorden.txt (één woord per regel, zelf aanvullen: bezienswaardigheden, gerechten, vliegveldcode…)
//   - --extra <bestand>    (optioneel nog een lijst)
// Gebruik: npm run lekcheck            (hele repo + git-historie + dist)
//          npm run lekcheck -- --alleen-dist
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const alleenDist = args.includes('--alleen-dist')
const extraIdx = args.indexOf('--extra')
const extra = extraIdx >= 0 ? args[extraIdx + 1] : null

const normaal = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const woorden = new Set()
function voegToe(w) {
  const n = normaal(String(w || '').trim())
  if (n.length >= 3) woorden.add(n)
}

if (fs.existsSync('secret/content.json')) {
  const c = JSON.parse(fs.readFileSync('secret/content.json', 'utf8'))
  // Alleen namen (met hoofdletter), geen gewone woorden als "centrum".
  const ALGEMEEN = new Set(['centrum', 'straat', 'plein', 'appartement', 'hotel', 'precies', 'adres', 'invullen'])
  voegToe(c.bestemming?.plaats)
  if (!ALGEMEEN.has(normaal(c.praktisch?.adres?.naam || ''))) voegToe(c.praktisch?.adres?.naam)
  const namen = `${c.bestemming?.regio || ''} ${c.praktisch?.adres?.adres || ''}`
  for (const deel of namen.split(/[\s,()·]+/)) {
    if (deel.length >= 5 && /^\p{Lu}/u.test(deel) && !/\d/.test(deel) && !ALGEMEEN.has(normaal(deel))) voegToe(deel)
  }
}
for (const lijst of ['secret/lekwoorden.txt', extra].filter(Boolean)) {
  if (!fs.existsSync(lijst)) continue
  for (const regel of fs.readFileSync(lijst, 'utf8').split('\n')) {
    if (regel.trim() && !regel.startsWith('#')) voegToe(regel)
  }
}

if (woorden.size === 0) {
  console.warn('⚠️  Geen verboden woorden gevonden. Maak secret/content.json en/of secret/lekwoorden.txt aan.')
  process.exit(0)
}

const OVERSLAAN = new Set(['node_modules', '.git', 'secret', '.wrangler', '.dev.vars', '.DS_Store'])
function* bestanden(map) {
  if (!fs.existsSync(map)) return
  for (const e of fs.readdirSync(map, { withFileTypes: true })) {
    if (OVERSLAAN.has(e.name)) continue
    const p = path.join(map, e.name)
    if (e.isDirectory()) yield* bestanden(p)
    else yield p
  }
}

const masker = (w) => w[0] + '*'.repeat(w.length - 1)
// Korte woorden (zoals een vliegveldcode) alleen als los woord, langere ook binnen een woord.
const zoekers = [...woorden].map((w) => {
  const veilig = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [w, new RegExp(w.length <= 4 ? `(^|[^a-z0-9])${veilig}([^a-z0-9]|$)` : veilig)]
})
const lekken = []
function scan(naam, inhoud) {
  const regels = normaal(inhoud).split('\n')
  regels.forEach((regel, i) => {
    for (const [w, re] of zoekers) if (re.test(regel)) lekken.push(`${naam}:${i + 1}  →  "${masker(w)}"`)
  })
}

for (const p of bestanden(alleenDist ? 'dist' : '.')) {
  scan(p, p) // ook bestandsnamen/paden
  scan(p, fs.readFileSync(p, 'utf8'))
}

if (!alleenDist && fs.existsSync('.git')) {
  try {
    scan('git-log', execSync('git log --all --format=%B%n%an%n%D', { encoding: 'utf8' }))
    scan('git-branches', execSync('git branch -a', { encoding: 'utf8' }))
    scan('git-historie', execSync('git log --all -p', { encoding: 'utf8', maxBuffer: 1 << 28 }))
  } catch {
    /* nog geen commits */
  }
}

if (lekken.length) {
  console.error(`🚨 ${lekken.length} mogelijk lek(ken) gevonden:`)
  for (const l of [...new Set(lekken)]) console.error('   ' + l)
  process.exit(1)
}
console.log(`✅ Geen lekken gevonden (${woorden.size} verboden woorden gecontroleerd${alleenDist ? ', alleen dist/' : ''}).`)
