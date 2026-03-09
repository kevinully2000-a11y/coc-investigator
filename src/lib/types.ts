export interface Characteristics {
  STR: number;
  CON: number;
  SIZ: number;
  DEX: number;
  APP: number;
  INT: number;
  POW: number;
  EDU: number;
  LUK: number;
}

export interface DerivedStats {
  HP: number;
  MP: number;
  SAN: number;
  DB: string;
  Build: number;
  Move: number;
}

export interface Skill {
  name: string;
  base: number;
  value: number;
}

export interface Investigator {
  name: string;
  age: number;
  occupation: string;
  era: string;
  residence: string;
  birthplace: string;
  characteristics: Characteristics;
  derived: DerivedStats;
  skills: Skill[];
}

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  setting: string;
  themes: string[];
  coverEmoji: string;
  premise: string;
}

export interface RollResult {
  id: number;
  type: string;
  count: number;
  results: number[];
  total: number;
  skillTarget?: number;
  checkResult?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type MoodType = 'calm' | 'tense' | 'dread' | 'panic' | 'otherworldly';

export type TabType = 'home' | 'library' | 'play' | 'create' | 'sheet' | 'dice';

// ─── Persistence Types ───
export interface SavedInvestigator extends Investigator {
  id: string;
  createdAt: number;
  activeSessionId?: string;
}

export interface GameSession {
  id: string;
  characterId: string;
  scenarioId: string;
  messages: ChatMessage[];
  sanity: number;
  hp: number;
  mood: MoodType;
  gameOver: boolean;
  updatedAt: number;
}
