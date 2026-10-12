// Algemene instellingen. Wordt gedeeld door de app en de Worker.
export const TITEL = 'Friends on Tour 2027'

// Moment waarop de bestemming opengaat (Europe/Amsterdam, zomertijd = +02:00).
export const ONTHULLING_ISO = '2027-04-28T00:00:00+02:00'

// rol: 'organisator' (ziet alles, geen tegelwachtwoorden) of 'deelnemer'
export const DEELNEMERS = [
  { naam: 'Tico', rol: 'deelnemer' },
  { naam: 'Bouke', rol: 'deelnemer' },
  { naam: 'Marco', rol: 'organisator' },
  { naam: 'Thomas', rol: 'deelnemer' },
  { naam: 'Jop', rol: 'organisator' },
]
