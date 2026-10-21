// Algemene instellingen.
export const TITEL = 'Friends on Tour 2027'

// Moment waarop de bestemming opengaat (Europe/Amsterdam, zomertijd = +02:00).
export const ONTHULLING_ISO = '2027-04-28T00:00:00+02:00'

// rol: 'organisator' (organisatorwachtwoord opent alles) of 'deelnemer'
// foto: uitsnede in public/profiel/, gemaakt met `npm run profielfotos`
export const DEELNEMERS = [
  { naam: 'Tico', rol: 'deelnemer', foto: 'profiel/tico.webp' },
  { naam: 'Bouke', rol: 'deelnemer', foto: 'profiel/bouke.webp' },
  { naam: 'Marco', rol: 'organisator', foto: 'profiel/marco.webp' },
  { naam: 'Thomas', rol: 'deelnemer', foto: 'profiel/thomas.webp' },
  { naam: 'Jop', rol: 'organisator', foto: 'profiel/jop.webp' },
]

export const persoon = (naam) => DEELNEMERS.find((d) => d.naam === naam)
