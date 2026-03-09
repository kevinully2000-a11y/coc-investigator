import { useState } from 'react';
import type { SavedInvestigator } from '../lib/types';
import { listCharacters, deleteCharacter, getSessionsForCharacter } from '../lib/storage';
import Button from './Button';

interface Props {
  onSelect: (character: SavedInvestigator) => void;
  onNewInvestigator: () => void;
  activeCharacterId?: string;
}

export default function CharacterLibrary({ onSelect, onNewInvestigator, activeCharacterId }: Props) {
  const [characters, setCharacters] = useState<SavedInvestigator[]>(listCharacters);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteCharacter(id);
    setCharacters(listCharacters());
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-eldritch-glow">Investigator Library</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {characters.length === 0
              ? 'No investigators yet. Create your first one.'
              : `${characters.length} investigator${characters.length !== 1 ? 's' : ''} on file`}
          </p>
        </div>
        <Button onClick={onNewInvestigator} className="font-display">
          &#x2726; New Investigator
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-6xl opacity-30">&#x1F4DC;</div>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm">
            Your investigator files are empty. Create an investigator to begin your journey into the unknown.
          </p>
          <Button onClick={onNewInvestigator} size="lg" className="font-display px-8">
            &#x2726; Create Investigator
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {characters.map((char) => {
            const sessions = getSessionsForCharacter(char.id);
            const activeSession = sessions.find(s => s.id === char.activeSessionId);
            const isActive = char.id === activeCharacterId;

            return (
              <div
                key={char.id}
                className={`parchment-surface rounded-md p-5 space-y-3 transition-shadow ${
                  isActive ? 'eldritch-glow ring-1 ring-[hsl(var(--primary))]' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[hsl(var(--foreground))]">
                      {char.name}
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {char.occupation} &middot; {char.era}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-mono bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs font-mono">
                  <span>
                    SAN: <strong className={
                      (activeSession ? activeSession.sanity : char.derived.SAN) < 20 ? 'text-blood' : ''
                    }>
                      {activeSession ? activeSession.sanity : char.derived.SAN}
                    </strong>
                    <span className="text-[hsl(var(--muted-foreground))]">/{char.derived.SAN}</span>
                  </span>
                  <span>
                    HP: <strong className={
                      (activeSession ? activeSession.hp : char.derived.HP) < 3 ? 'text-blood' : ''
                    }>
                      {activeSession ? activeSession.hp : char.derived.HP}
                    </strong>
                    <span className="text-[hsl(var(--muted-foreground))]">/{char.derived.HP}</span>
                  </span>
                  <span>STR: {char.characteristics.STR}</span>
                  <span>DEX: {char.characteristics.DEX}</span>
                  <span>INT: {char.characteristics.INT}</span>
                </div>

                {/* Session info */}
                {activeSession && !activeSession.gameOver && (
                  <p className="text-xs text-[hsl(var(--secondary))] font-mono">
                    &#x25B6; Active scenario &middot; {activeSession.messages.length} turns
                  </p>
                )}
                {sessions.length > 0 && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''} played
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => onSelect(char)}
                    className="font-display text-xs flex-1"
                  >
                    {activeSession && !activeSession.gameOver ? '\u25B6 Resume' : '\u25B6 Play'}
                  </Button>
                  {confirmDelete === char.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(char.id)}
                        className="text-xs text-blood"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(char.id)}
                      className="text-xs text-[hsl(var(--muted-foreground))]"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
