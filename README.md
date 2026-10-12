# 🕵️ Operatie Mysterieweekend

Installeerbare web-app (PWA) voor het geheime vriendenweekend. Tot **28 april 2027 00:00** (Amsterdamse tijd) ziet iedereen alleen een aftelklok, dwaalspoor-hints en spelletjes. Daarna gaat de enveloppe open.

**Stack:** Vite + React + Tailwind, met één Cloudflare Worker als kluis en gedeelde opslag (KV).

## Hoe het slot werkt (kort)

- De echte gegevens staan in `secret/reveal.json`. Die map staat in `.gitignore` en komt **nooit** in de bundle of in git.
- Met `npm run geheim:upload` gaat die data als versleuteld *secret* naar Cloudflare.
- De app vraagt de data op via `/api/onthulling`. De Worker kijkt naar de **servertijd**. Je telefoonklok verzetten heeft dus geen zin, en in de broncode staat niks.
- Ook gokken worden op de server vastgezet en pas na de onthulling teruggegeven.
- Met een organisatorcode (alleen jij) krijg je een preview vóór de datum.

## 1. Lokaal draaien

```bash
npm install
npm run geheim:lokaal   # maakt secret/codes.json + .dev.vars (gebruikt nepdata als reveal.json nog ontbreekt)
npm run build
npm run worker          # app + API op http://localhost:8787
```

Wil je live herladen tijdens het bouwen? Laat `npm run worker` draaien en start in een tweede terminal `npm run dev` (http://localhost:5173, stuurt `/api` door naar de Worker).

Open de app, kies je naam en vul de **groepscode** in (staat in `secret/codes.json`, standaard `geheimagent`).

Lokale testdata (gokken, kas, foto's) staat in `.wrangler/state`. Gooi die map weg om opnieuw te beginnen.

## 2. Geheime data invullen

1. Kopieer het voorbeeld:
   ```bash
   cp secret/reveal.example.json secret/reveal.json
   ```
2. Vul `secret/reveal.json` in: bestemming, land, `coordinaten` (lat/lon, nodig voor de *dichtst-bij-prijs*), heen- en terugreis, tickets, verblijf, `programma` (per dag een titel, activiteiten en een optionele notitie), `organisatie` (blokken met regels en links, bijv. vervoer en budget), `actiepunten` (startlijst voor *Regelzaken*) en `pakadvies` (komt na de onthulling bovenaan de paklijst).
3. Pas `secret/codes.json` aan:
   - `organisatorCode`: jouw geheime preview-code. Maak hem lang, want raden moet onmogelijk zijn.
   - `groepscode`: de code die je in de groepsapp deelt, zodat vreemden niks kunnen.
   - `testTijd`: laat leeg (zie stap 4).
4. Maak `secret/lekwoorden.txt` met één woord per regel: de bestemming in alle talen, bezienswaardigheden, typische gerechten, de vliegveldcode, enzovoort. De lekcheck gebruikt deze lijst samen met `reveal.json`.
5. Draai `npm run geheim:lokaal` opnieuw.

## 3. Deployen naar Cloudflare (gratis)

Eenmalig:

```bash
npx wrangler login
npx wrangler kv namespace create DATA
```

Plak het `id` dat je terugkrijgt in `wrangler.toml` (bij `VUL_HIER_HET_KV_ID_IN`). Zet de app daarna online en upload de geheimen:

```bash
npm run deploy
npm run geheim:upload
```

Elke keer dat je daarna iets wijzigt, is `npm run deploy` genoeg.

`deploy` draait eerst de lekcheck op de repo, bouwt de app, controleert de build en zet hem online. Vindt de lekcheck iets, dan stopt alles.

Na de eerste deploy krijg je een adres zoals `https://operatie-mysterieweekend.<jouwnaam>.workers.dev`. Zet dat in `.env` bij `VITE_SITE_URL` en deploy nog een keer. Dan toont WhatsApp het neutrale deel-plaatje ("Een geheim weekend").

Heb je `reveal.json` of de codes aangepast? Draai dan opnieuw `npm run geheim:upload`. Dat werkt meteen, zonder nieuwe deploy.

**Installeren op de telefoon:** open de link in Safari (iPhone) en kies *Deel → Zet op beginscherm*. Op Android kies je in Chrome *⋮ → App installeren*.

## 4. De onthulling testen

**Als organisator (ook online):** tik rechtsboven op je naam (⚙️), vul je organisatorcode in en druk op OK. Er verschijnt een rode balk "ORGANISATOR-PREVIEW" en op *Basis* staat de knop **Open je enveloppe**. Met "Enveloppe opnieuw dichtplakken" kun je de animatie nog eens bekijken. Zet de preview daarna weer uit.

**Het echte tijdslot (alleen lokaal):** zet in `secret/codes.json` bijvoorbeeld `"testTijd": "2027-04-28T00:00:05+02:00"`, draai `npm run geheim:lokaal` en herstart `npm run worker`. Dan gedraagt de lokale server zich alsof het die tijd is. Probeer ook `2027-04-27T23:59:55+02:00`: dan moet alles nog dicht zijn. Maak `testTijd` daarna weer leeg. Online werkt deze truc niet: daar telt alleen de echte klok.

## 5. Inhoud aanpassen

| Wat | Bestand |
|---|---|
| Namen van de agenten | `src/data/spelers.json` |
| Hints (datum + tekst) | `src/data/hints.json` |
| Quizvragen | `src/data/quiz.json` |
| Bingovakjes | `src/data/bingo.json` |
| Algemene paklijst (per categorie), vertrekbord, mijlpalen, easter-egg-teksten | `src/data/extra.json` |
| Onthullingsmoment | `src/data/moment.js` |

Over een paar onderdelen:

- **Quiz:** laat `antwoord` op `null` staan, dan beslist de groep: je scoort als je hetzelfde kiest als de meerderheid. Vul je een naam in, dan telt die. Let op: ingevulde antwoorden staan wél in de app-code.
- **Hints** zijn bewust misleidend. Lees ze nog eens kritisch door: geen enkele hint mag per ongeluk kloppen.
- **Kas:** €500 per persoon staat in `src/schermen/Groep.jsx` (`INLEG`).

## Functies

Aftelklok · cryptische hints · gokspel met dichtst-bij-prijs · vriendenquiz met scorebord · gedeelde kas · playlist (1 nummer p.p.) · weekend-bingo (eigen kaart per persoon) · nep-vertrekbord · paklijst met categorieën, voortgang en eigen items (plus geheim pakadvies na de onthulling) · mijlpaal-badges · dossier met dagprogramma en organisatie-info · fotomuur (pas na onthulling) · enveloppe met confetti en fanfare · easter egg: tik 7× snel op het logo.

**Alleen voor de organisatie** (met organisatorcode): *Groep → 🔑 Regelen*, een gedeelde takenlijst. De eerste keer wordt hij gevuld met de `actiepunten` uit `reveal.json`. Zonder code geeft de server deze lijst nooit terug.

## Veiligheid van de verrassing

- Draai `npm run lekcheck` vóór elke commit. `npm run deploy` doet het automatisch, ook op de git-historie en de build.
- Zet de bestemming nooit in commit-berichten, bestandsnamen of branchnamen.
- De repo is privé, maar ga er voor de zekerheid van uit dat iemand meekijkt.
