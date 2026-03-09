import type { Characteristics, DerivedStats, Skill, Scenario } from './types';

// ─── Dice Rolling ───
function roll3d6(): number {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1).reduce((a, b) => a + b, 0);
}

function roll2d6plus6(): number {
  return Array.from({ length: 2 }, () => Math.floor(Math.random() * 6) + 1).reduce((a, b) => a + b, 0) + 6;
}

export function rollCharacteristics(): Characteristics {
  return {
    STR: roll3d6() * 5,
    CON: roll3d6() * 5,
    SIZ: roll2d6plus6() * 5,
    DEX: roll3d6() * 5,
    APP: roll3d6() * 5,
    INT: roll2d6plus6() * 5,
    POW: roll3d6() * 5,
    EDU: roll2d6plus6() * 5,
    LUK: roll3d6() * 5,
  };
}

export function calculateDerived(chars: Characteristics, age: number): DerivedStats {
  const HP = Math.floor((chars.CON + chars.SIZ) / 10);
  const MP = Math.floor(chars.POW / 5);
  const SAN = chars.POW;

  const strSiz = chars.STR + chars.SIZ;
  let DB: string, Build: number;
  if (strSiz <= 64) { DB = '-2'; Build = -2; }
  else if (strSiz <= 84) { DB = '-1'; Build = -1; }
  else if (strSiz <= 124) { DB = '0'; Build = 0; }
  else if (strSiz <= 164) { DB = '+1d4'; Build = 1; }
  else { DB = '+1d6'; Build = 2; }

  let Move = 8;
  if (chars.DEX < chars.SIZ && chars.STR < chars.SIZ) Move = 7;
  else if (chars.DEX > chars.SIZ && chars.STR > chars.SIZ) Move = 9;
  if (age >= 40) Move -= Math.floor((age - 30) / 10);
  Move = Math.max(Move, 1);

  return { HP, MP, SAN, DB, Build, Move };
}

// ─── Skills ───
const BASE_SKILLS: { name: string; base: number }[] = [
  { name: 'Accounting', base: 5 },
  { name: 'Anthropology', base: 1 },
  { name: 'Appraise', base: 5 },
  { name: 'Archaeology', base: 1 },
  { name: 'Art/Craft', base: 5 },
  { name: 'Charm', base: 15 },
  { name: 'Climb', base: 20 },
  { name: 'Credit Rating', base: 0 },
  { name: 'Cthulhu Mythos', base: 0 },
  { name: 'Disguise', base: 5 },
  { name: 'Dodge', base: 0 },
  { name: 'Drive Auto', base: 20 },
  { name: 'Elec. Repair', base: 10 },
  { name: 'Fast Talk', base: 5 },
  { name: 'Fighting (Brawl)', base: 25 },
  { name: 'Firearms (Handgun)', base: 20 },
  { name: 'Firearms (Rifle)', base: 25 },
  { name: 'First Aid', base: 30 },
  { name: 'History', base: 5 },
  { name: 'Intimidate', base: 15 },
  { name: 'Jump', base: 20 },
  { name: 'Language (Own)', base: 0 },
  { name: 'Language (Other)', base: 1 },
  { name: 'Law', base: 5 },
  { name: 'Library Use', base: 20 },
  { name: 'Listen', base: 20 },
  { name: 'Locksmith', base: 1 },
  { name: 'Mech. Repair', base: 10 },
  { name: 'Medicine', base: 1 },
  { name: 'Natural World', base: 10 },
  { name: 'Navigate', base: 10 },
  { name: 'Occult', base: 5 },
  { name: 'Persuade', base: 10 },
  { name: 'Photography', base: 5 },
  { name: 'Psychoanalysis', base: 1 },
  { name: 'Psychology', base: 10 },
  { name: 'Ride', base: 5 },
  { name: 'Science', base: 1 },
  { name: 'Sleight of Hand', base: 10 },
  { name: 'Spot Hidden', base: 25 },
  { name: 'Stealth', base: 20 },
  { name: 'Survival', base: 10 },
  { name: 'Swim', base: 20 },
  { name: 'Throw', base: 20 },
  { name: 'Track', base: 10 },
];

export function generateSkills(chars: Characteristics): Skill[] {
  return BASE_SKILLS.map((s) => {
    let base = s.base;
    if (s.name === 'Dodge') base = Math.floor(chars.DEX / 2);
    if (s.name === 'Language (Own)') base = chars.EDU;
    return { name: s.name, base, value: base };
  });
}

export function getOccupationPoints(occupation: string, chars: Characteristics): number {
  switch (occupation) {
    case 'Antiquarian': case 'Author': case 'Doctor of Medicine':
    case 'Engineer': case 'Journalist': case 'Lawyer':
    case 'Librarian': case 'Missionary': case 'Parapsychologist':
    case 'Professor':
      return chars.EDU * 4;
    case 'Dilettante': case 'Entertainer':
      return chars.EDU * 2 + chars.APP * 2;
    case 'Drifter':
      return chars.EDU * 2 + (chars.APP > chars.DEX ? chars.APP : chars.DEX) * 2;
    case 'Farmer': case 'Military Officer': case 'Police Detective':
    case 'Private Investigator': case 'Tribal Member':
      return chars.EDU * 2 + (chars.DEX > chars.STR ? chars.DEX : chars.STR) * 2;
    default:
      return chars.EDU * 4;
  }
}

export function getPersonalInterestPoints(chars: Characteristics): number {
  return chars.INT * 2;
}

// ─── Constants ───
export const ERAS = ['1920s Classic', 'Modern Day', 'Gaslight (1890s)', 'Dark Ages'];

export const OCCUPATIONS = [
  'Antiquarian', 'Author', 'Dilettante', 'Doctor of Medicine', 'Drifter',
  'Engineer', 'Entertainer', 'Farmer', 'Journalist', 'Lawyer', 'Librarian',
  'Military Officer', 'Missionary', 'Parapsychologist', 'Police Detective',
  'Private Investigator', 'Professor', 'Tribal Member',
];

export const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;

export const DICE_SIDES: Record<string, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

export function rollDice(type: string, count: number = 1): number[] {
  const sides = DICE_SIDES[type] || 100;
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

export function checkResult(roll: number, target: number): string {
  if (roll === 1) return 'critical';
  if (roll <= Math.floor(target / 5)) return 'extreme';
  if (roll <= Math.floor(target / 2)) return 'hard';
  if (roll <= target) return 'regular';
  if ((roll >= 96 && target < 50) || roll === 100) return 'fumble';
  return 'fail';
}

// ─── Scenarios ───
export const SCENARIOS: Scenario[] = [
  {
    id: 'st-mercy',
    title: "St. Mercy's Last Patient",
    tagline: 'An abandoned psychiatric hospital. One final voicemail.',
    setting: 'Abandoned St. Mercy Psychiatric Hospital, outskirts of a rust-belt city, present day. Winter. The building has been closed for 15 years after a scandal involving experimental treatments.',
    themes: ['isolation', 'madness', 'medical horror', 'institutional decay'],
    coverEmoji: '\u{1F3E5}',
    premise: `The investigator receives a voicemail from their estranged college friend, Dr. Nadia Vasquez, who went missing two weeks ago while researching her documentary on St. Mercy's Psychiatric Hospital. The voicemail is garbled \u2014 heavy breathing, the sound of dripping water, and Nadia whispering: "The basement. They never closed the basement. The patients are still here... they never left." The investigator arrives at the condemned building at dusk. The chain on the front gate has been recently cut. Nadia's car is in the parking lot, covered in frost, engine cold. The hospital looms \u2014 five stories of crumbling brick and shattered windows. Inside, decades of abandonment: overturned wheelchairs, scattered files, graffiti. But some rooms show signs of recent habitation. And from somewhere deep below, a rhythmic thumping \u2014 like a heartbeat, or someone hitting a pipe. The horror: The hospital's former director, Dr. Emil Kresh, discovered that certain sound frequencies could open human consciousness to entities from beyond. His "treatments" weren't curing patients \u2014 they were making them receptacles. The basement contains his frequency generator, still operational, powered by something that shouldn't exist. The "patients" that remain are hollow vessels, bodies kept animate by the things wearing them. And Nadia has been down there for two weeks, listening.`,
  },
  {
    id: 'signal-return',
    title: 'The Signal Return',
    tagline: "A dead satellite starts transmitting. You shouldn't have listened.",
    setting: "A small university radio astronomy lab and surrounding college town, present day. Autumn. The campus is mostly empty for fall break.",
    themes: ['cosmic horror', 'technology', 'paranoia', 'transformation'],
    coverEmoji: '\u{1F4E1}',
    premise: `The investigator works at (or is connected to) the university's radio astronomy department. Three days ago, a decommissioned Cold War satellite \u2014 ECHO-7, officially dead since 1991 \u2014 began transmitting again. The signal is impossible: it's coming from a satellite that has no power source and should have de-orbited years ago. The department's automated systems picked it up. Professor Alan Marsh, the lead researcher, became obsessed with decoding the signal and hasn't left the lab in 48 hours. He sent one email to the investigator: "It's not random. It's structured. I think it's answering us." When the investigator arrives at the lab, Marsh is gone. His notes cover every surface \u2014 walls, floor, windows \u2014 in a spiral pattern. The decoded signal fragments read like instructions for modifying the human auditory cortex. The radio telescope is still pointed at ECHO-7, and the signal is getting stronger. Other students who heard the signal playback are behaving strangely: they stand in open spaces, faces tilted upward, humming in unison. The horror: ECHO-7 was repurposed during a classified Cold War experiment to broadcast into deep space. Something answered. The signal is a consciousness \u2014 vast, patient, alien \u2014 that uses radio waves as a vector for colonization. Those who hear the full decoded signal begin a physical transformation, their bodies slowly restructuring to receive and retransmit. Professor Marsh decoded enough to begin changing. The signal is now broadcasting from the campus radio tower.`,
  },
  {
    id: 'beneath-meridian',
    title: 'Beneath Meridian Heights',
    tagline: 'The new luxury apartments have a problem in the foundation.',
    setting: 'Meridian Heights, a recently completed luxury apartment complex in a gentrifying neighborhood, present day. A rainy October week.',
    themes: ['urban horror', 'corporate conspiracy', 'underground', 'ancient evil'],
    coverEmoji: '\u{1F3E2}',
    premise: `The investigator has just moved into Meridian Heights \u2014 a gleaming new luxury apartment complex built on the site of a demolished tenement block. Everything is perfect: smart home systems, rooftop garden, concierge service. Too perfect. Within the first week, strange things emerge. The building's smart home AI, "Haven," sometimes speaks unprompted, saying things like "The foundation remembers" before reverting to normal. Other residents report vivid shared nightmares about descending endless stairs. Three residents on the ground floor have moved out without explanation. The investigator discovers that the building's foundation goes much deeper than blueprints show \u2014 construction crews hit "something" during excavation, and the developer, Meridian Corp, sealed an entire sub-basement level rather than report it. A maintenance worker, Jorge, confides that he's heard chanting from below the parking garage at 3 AM. He shows the investigator a door in the lowest level marked "DO NOT OPEN \u2014 STRUCTURAL" that vibrates faintly to the touch. The horror: The tenement that stood here for 130 years was built over a sealed chamber constructed by a 19th-century occult society. The chamber contains a binding \u2014 a ritual prison holding a dreaming entity that feeds on concentrated human habitation. The tenement's poverty and suffering sustained the binding. The demolition weakened it. Meridian Corp's CEO knows \u2014 she's a descendant of the original society, and the luxury complex was designed to be the entity's new feeding ground. The "smart home" system is actually a modernized version of the binding ritual, monitoring and harvesting the psychic energy of residents. But the binding is failing, and the entity is waking up.`,
  },
];
