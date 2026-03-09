import type { Investigator, SavedInvestigator, GameSession } from './types';

const CHARS_KEY = 'coc-characters';
const SESSIONS_KEY = 'coc-sessions';

// ─── Characters ───
export function saveCharacter(inv: Investigator): SavedInvestigator {
  const saved: SavedInvestigator = {
    ...inv,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const chars = listCharacters();
  chars.push(saved);
  localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
  return saved;
}

export function listCharacters(): SavedInvestigator[] {
  try {
    const raw = localStorage.getItem(CHARS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCharacter(id: string): SavedInvestigator | null {
  return listCharacters().find(c => c.id === id) ?? null;
}

export function updateCharacter(id: string, updates: Partial<SavedInvestigator>): void {
  const chars = listCharacters();
  const idx = chars.findIndex(c => c.id === id);
  if (idx >= 0) {
    chars[idx] = { ...chars[idx], ...updates };
    localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
  }
}

export function deleteCharacter(id: string): void {
  const chars = listCharacters().filter(c => c.id !== id);
  localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
  // Also delete all sessions for this character
  const sessions = listSessions().filter(s => s.characterId !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// ─── Sessions ───
function listSessions(): GameSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: GameSession): void {
  const sessions = listSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSession(id: string): GameSession | null {
  return listSessions().find(s => s.id === id) ?? null;
}

export function deleteSession(id: string): void {
  const sessions = listSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSessionsForCharacter(charId: string): GameSession[] {
  return listSessions().filter(s => s.characterId === charId);
}
