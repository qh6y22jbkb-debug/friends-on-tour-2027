# Friends on Tour 2027

Installeerbare web-app (PWA) voor het vriendenweekend. De bestemming blijft geheim tot **28 april 2027, 00:00** (Amsterdamse tijd).

**Stack:** Vite + React + Tailwind + Lucide-iconen. Eén Cloudflare Worker serveert de app, controleert alles en bewaart gedeelde gegevens in KV.

## Hoe de beveiliging werkt

- Iedereen kiest zijn naam en maakt de eerste keer een eigen wachtwoord. Dat wordt gehasht opgeslagen (PBKDF2 met salt). Na 8 foute pogingen volgt een kwartier pauze.
- Alle geheime inhoud staat in `secret/content.json`. Dat bestand staat in `.gitignore` en komt nooit in de app-code. Het gaat als *secret* naar Cloudflare; de tegelwachtwoorden worden daarbij eerst gehasht.
- De server levert inhoud pas als alles klopt: sessie, rol, tegelwachtwoord en servertijd. De telefoonklok verzetten heeft dus geen zin.
- Ontgrendelde inhoud wordt niet op de telefoon opgeslagen. Na herladen ontgrendel je opnieuw.

| Tegel | Deelnemer | Organisator |
|---|---|---|
| Bestemming | wachtwoord **én** na 28 april | altijd |
| Dag 1–4 | eigen wachtwoord (ook vóór 28 april) | altijd |
| Praktisch | na 28 april | altijd |
| Organisatie | — | altijd |
| Paklijst, Kosten, Hints | altijd | altijd |

Namen en rollen staan in `src/config.js`.

## 1. Lokaal draaien

```bash
npm install
npm run geheim:lokaal   # maakt .dev.vars (en secret/codes.json); nepdata als content.json ontbreekt
npm run build
npm run worker          # app + API op http://localhost:8787
```

Na een wijziging in de code: `npm run build`, daarna de pagina verversen. Lokale testgegevens (wachtwoorden, kosten, vinkjes) staan in `.wrangler/state`. Gooi die map weg om opnieuw te beginnen.

## 2. Geheime inhoud invullen

```bash
cp secret/content.example.json secret/content.json
cp secret/hints.example.json secret/hints.json
```

- **`content.json`** bevat `bestemming`, `dagen` (id, datum, titel, items, notitie), `organisatie` (heen, terug, verblijf, terPlekke, boekingen met deadline, actiepunten), `praktisch` (adres, noodnummers, contacten) en `wachtwoorden` (één per tegel: `bestemming`, `dag-1`, `dag-2`, …). Hoofdletters en spaties aan begin/eind tellen niet mee.
- **`hints.json`** bevat een lijst `{ "datum": "JJJJ-MM-DD", "tekst": "…" }`. Een hint verschijnt vanaf zijn datum. Laat ze naar andere bestemmingen wijzen dan de echte.
- **`lekwoorden.txt`** (optioneel) bevat één woord per regel dat nooit in de code mag staan. De lekcheck gebruikt deze lijst plus de plaatsnaam uit `content.json`.

Draai daarna `npm run geheim:lokaal` en herstart `npm run worker`.

## 3. Deployen naar Cloudflare (gratis)

Eenmalig:

```bash
npx wrangler login
npx wrangler kv namespace create DATA
```

Zet het id dat je terugkrijgt in `wrangler.toml` bij `VUL_HIER_HET_KV_ID_IN`. Zet de app daarna online en upload de geheimen:

```bash
npm run deploy
npm run geheim:upload
```

Daarna is `npm run deploy` genoeg. Het draait eerst de lekcheck op de repo en de build. Pas je `content.json` of `hints.json` aan, dan volstaat `npm run geheim:upload`.

Zet het adres van de app (bijv. `https://friends-on-tour-2027.<jouwnaam>.workers.dev`) in `.env` bij `VITE_SITE_URL` en deploy opnieuw. Dan krijgt een gedeelde link het neutrale voorbeeldplaatje.

**Installeren op de telefoon:** Safari → Deel → Zet op beginscherm (iPhone), of Chrome → ⋮ → App installeren (Android).

## 4. De onthulling testen

- **Als organisator** zie je altijd alles. Zo controleer je de inhoud.
- **Als deelnemer, met testmodus:** zet in `secret/codes.json` bijvoorbeeld `"testTijd": "2027-04-28T00:00:05+02:00"`. Draai dan `npm run geheim:lokaal` en herstart `npm run worker`. De lokale server doet nu alsof het die tijd is. Log in als deelnemer en open Bestemming en Praktisch. Probeer ook `2027-04-27T23:59:55+02:00` (alles moet dan dicht zijn) en maak `testTijd` daarna weer leeg. Online werkt de testmodus niet.
- **Wachtwoord vergeten?** Een organisator kan via *Meer → Deelnemers* een wachtwoord resetten. De deelnemer maakt dan bij de volgende keer inloggen een nieuw wachtwoord aan, en oude sessies vervallen.

## Geen lekken

Draai `npm run lekcheck` vóór elke commit. Hij doorzoekt de repo, de build en de git-historie. Zet de bestemming nooit in code, commit-berichten, bestandsnamen of branchnamen.
