# Friends on Tour 2027

Installeerbare web-app (PWA) voor het vriendenweekend. Hij draait zonder server, gratis op GitHub Pages. De bestemming blijft geheim tot **28 april 2027**.

**Stack:** Vite + React + Tailwind + Lucide-iconen. Geen backend, geen database.

## Hoe het slot werkt

- Alle geheime inhoud staat in `secret/content.json`. Dat bestand staat in `.gitignore`.
- Bij elke build maakt `scripts/versleutel.mjs` daar een versleutelde kluis van (`src/kluis.json`, ook gitignored). Elke tegel krijgt een eigen AES-256-sleutel, die alleen opengaat met het tegelwachtwoord of het organisatorwachtwoord (PBKDF2, 310.000 rondes).
- In de broncode of de gebouwde app staat dus niets leesbaars. Zonder wachtwoord is de inhoud niet te openen.
- **Belangrijk:** zonder server kan de app de datum niet afdwingen. Het **bestemmingswachtwoord is het echte slot**: deel het pas uit op 28 april. De aftelklok en de melding "opent 28 april" zijn alleen ter info.
- Er is geen limiet op het aantal pogingen, dus gebruik lange wachtwoorden (bijv. `molen-vos-431`).

| Tegel | Opent met |
|---|---|
| Bestemming + Praktisch | bestemmingswachtwoord (pas uitdelen op 28 april) |
| Dag 1–4 | eigen dagwachtwoord |
| Organisatie | alleen organisatorwachtwoord |
| Paklijst, Hints | altijd open |

Deelnemers loggen in met hun eigen wachtwoord (`deelnemerWachtwoorden` in `secret/codes.json`); daarna onthoudt hun telefoon wie ze zijn. In de app staat alleen een hash (PBKDF2 met salt), nooit het wachtwoord zelf. Het inlogwachtwoord voorkomt dat iemand als een ander inlogt; het opent zelf geen geheime inhoud. Organisatoren (in `src/config.js`) vullen na het kiezen van hun naam het organisatorwachtwoord in. Dat opent alles. Ontgrendelde inhoud wordt nergens bewaard: na herladen vul je het opnieuw in. Alleen je naam en je vinkjes (paklijst, organisatie) onthoudt de app, op je eigen telefoon.

## 1. Lokaal draaien

```bash
npm install
npm run dev        # http://localhost:5173/friends-on-tour-2027/
```

Of bekijk de gebouwde versie zoals hij online komt:

```bash
npm run build
npm run preview    # http://localhost:4180/friends-on-tour-2027/
```

## 2. Geheime inhoud invullen

```bash
cp secret/content.example.json secret/content.json
cp secret/hints.example.json secret/hints.json
```

- **`content.json`** bevat `bestemming`, `dagen` (id, datum, titel, items, notitie), `organisatie` (heen, terug, verblijf, terPlekke, kosten, boekingen, actiepunten), `praktisch` (adres, noodnummers, contacten) en `wachtwoorden` (`bestemming`, `dag-1`, `dag-2`, …). Hoofdletters en spaties aan begin/eind tellen niet mee.
- **`hints.json`** bevat een lijst `{ "datum": "JJJJ-MM-DD", "tekst": "…" }`. Hints staan niet versleuteld in de app en tonen vanaf hun datum. Ze zijn bedoeld als dwaalspoor; zet er niets echts in.
- **`secret/codes.json`** wordt de eerste keer automatisch gemaakt, met het organisatorwachtwoord. Voeg hier ook `deelnemerWachtwoorden` toe, bijvoorbeeld `{ "Tico": "…" }`. Hoofdletters en spaties aan begin/eind tellen niet mee.
- **`secret/lekwoorden.txt`** (optioneel) bevat woorden die nooit in de app mogen staan, voor de lekcheck.

Elke `npm run dev`, `build` of `deploy` versleutelt de inhoud opnieuw.

## 3. Online zetten (GitHub Pages)

```bash
npm run deploy
```

Dit draait de lekcheck (repo, git-historie en build), bouwt de app en zet `dist/` op de branch `gh-pages`. De app staat dan op:

**https://qh6y22jbkb-debug.github.io/friends-on-tour-2027/**

Eenmalig moet in GitHub *Settings → Pages* staan: *Deploy from branch → gh-pages / (root)*.

**Installeren op de telefoon:** Safari → Deel → Zet op beginscherm (iPhone), of Chrome → ⋮ → App installeren (Android).

## 4. De onthulling testen

- **Als organisator** zie je altijd alles. Zo controleer je de inhoud.
- **Testmodus** (alleen lokaal): maak `.env.local` aan met `VITE_TEST_TIJD=2027-04-28T00:00:05+02:00` en start `npm run dev`. De app doet dan alsof het die tijd is. Kies een deelnemersnaam en open Bestemming met het bestemmingswachtwoord. Haal `.env.local` daarna weer weg. De testmodus gaat nooit mee in `npm run build`.

## Geen lekken

Draai `npm run lekcheck` vóór elke commit (`deploy` doet het automatisch). Zet de bestemming nooit in code, commit-berichten, bestandsnamen of hints.
