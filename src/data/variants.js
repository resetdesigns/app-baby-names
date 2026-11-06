// Names in the deck that are spellings of the same name. Used to group matches
// and to show "also spelled" on the back of a card.
const GROUPS = [
  ['Aiden', 'Ayden'],
  ['Braden', 'Braeden', 'Brayden'],
  ['Caden', 'Cayden', 'Kaden', 'Kaiden', 'Kayden'],
  ['Jaden', 'Jaiden', 'Jayden'],
  ['Jackson', 'Jaxon', 'Jaxson'],
  ['Jace', 'Jayce'],
  ['Cameron', 'Kameron'],
  ['Carson', 'Karson'],
  ['Conner', 'Connor', 'Konnor'],
  ['Cory', 'Corey'],
  ['Colin', 'Collin'],
  ['Cody', 'Kody'],
  ['Colton', 'Kolton'],
  ['Damian', 'Damien'],
  ['Darrell', 'Darryl'],
  ['Elliot', 'Elliott'],
  ['Eric', 'Erik'],
  ['Gunnar', 'Gunner'],
  ['Glen', 'Glenn'],
  ['Geoffrey', 'Jeffrey'],
  ['Jacob', 'Jakob'],
  ['Jason', 'Jayson'],
  ['Julian', 'Julien'],
  ['Caleb', 'Kaleb'],
  ['Cason', 'Kasen'],
  ['Kellan', 'Kellen'],
  ['Killian', 'Kylian'],
  ['Lucas', 'Lukas'],
  ['Luca', 'Luka'],
  ['Louis', 'Luis'],
  ['Marc', 'Mark'],
  ['Marcos', 'Marcus'],
  ['Mateo', 'Matteo'],
  ['Matias', 'Matthias'],
  ['Mohamed', 'Mohammad'],
  ['Nicholas', 'Nicolas'],
  ['Neal', 'Neil'],
  ['Reed', 'Reid'],
  ['Sean', 'Shaun', 'Shawn'],
  ['Stefan', 'Stephen', 'Steven'],
  ['Tristan', 'Tristen'],
  ['Isaiah', 'Izaiah'],
  ['Xander', 'Zander'],
  ['Ulises', 'Ulysses'],
  ['Zachariah', 'Zachary'],
  ['Christian', 'Kristian'],
  ['Chris', 'Kris'],
]

const groupOf = new Map()
GROUPS.forEach((group, i) => group.forEach((name) => groupOf.set(name, i)))

// Same key means "spellings of the same name". Names with no variants get a key of their own.
export const variantKey = (name) => (groupOf.has(name) ? `group:${groupOf.get(name)}` : `solo:${name}`)

export function otherSpellings(name) {
  if (!groupOf.has(name)) return []
  return GROUPS[groupOf.get(name)].filter((n) => n !== name)
}
