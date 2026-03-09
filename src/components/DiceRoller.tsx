import { useState } from 'react';
import type { RollResult } from '../lib/types';
import { DICE_TYPES, rollDice, checkResult } from '../lib/gameData';
import Button from './Button';
import Input from './Input';

const resultColors: Record<string, string> = {
  critical: 'text-[hsl(var(--primary))]',
  extreme: 'text-[hsl(var(--primary))]',
  hard: 'text-[hsl(var(--secondary))]',
  regular: 'text-[hsl(var(--foreground))]',
  fail: 'text-blood',
  fumble: 'text-blood',
};

export default function DiceRoller() {
  const [dieType, setDieType] = useState('d100');
  const [count, setCount] = useState(1);
  const [skillTarget, setSkillTarget] = useState(50);
  const [isSkillCheck, setIsSkillCheck] = useState(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      const results = rollDice(dieType, count);
      const total = results.reduce((a, b) => a + b, 0);
      const roll: RollResult = {
        id: Date.now(),
        type: dieType,
        count,
        results,
        total,
      };

      if (isSkillCheck && dieType === 'd100' && count === 1) {
        roll.skillTarget = skillTarget;
        roll.checkResult = checkResult(total, skillTarget);
      }

      setHistory((prev) => [roll, ...prev.slice(0, 19)]);
      setIsRolling(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Die type selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        {DICE_TYPES.map((d) => (
          <button
            key={d}
            onClick={() => {
              setDieType(d);
              if (d !== 'd100') setIsSkillCheck(false);
            }}
            className={`px-4 py-2 rounded-md font-mono text-sm uppercase transition-all border cursor-pointer ${
              dieType === d
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))] eldritch-glow'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Count and skill check options */}
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-center">
        <div className="space-y-1">
          <label className="font-display text-xs">Count</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
            className="w-20 text-center"
          />
        </div>

        {dieType === 'd100' && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSkillCheck}
                onChange={(e) => setIsSkillCheck(e.target.checked)}
                className="accent-[hsl(var(--primary))]"
              />
              <span className="text-sm text-[hsl(var(--muted-foreground))] font-display">Skill Check</span>
            </label>

            {isSkillCheck && (
              <div className="space-y-1">
                <label className="font-display text-xs">Skill %</label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={skillTarget}
                  onChange={(e) => setSkillTarget(Number(e.target.value))}
                  className="w-20 text-center"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roll button */}
      <div className="text-center">
        <Button onClick={handleRoll} disabled={isRolling} size="lg" className="px-12 text-lg font-display">
          <span className={isRolling ? 'animate-dice-roll inline-block' : ''}>&#x1F3B2;</span>
          {' '}Roll {count > 1 ? `${count}` : ''}{dieType}
        </Button>
      </div>

      {/* Latest result */}
      {history.length > 0 && (
        <div className="parchment-surface rounded-md p-6 text-center animate-fade-in-up">
          <div className="text-5xl font-display font-bold mb-2">{history[0].total}</div>

          {history[0].results.length > 1 && (
            <div className="text-sm text-[hsl(var(--muted-foreground))] font-mono">
              [{history[0].results.join(', ')}]
            </div>
          )}

          {history[0].checkResult && (
            <div className={`text-lg font-display font-bold mt-2 uppercase ${resultColors[history[0].checkResult]}`}>
              {history[0].checkResult === 'critical' && '\u2726 Critical Success!'}
              {history[0].checkResult === 'extreme' && '\u2605 Extreme Success'}
              {history[0].checkResult === 'hard' && '\u25C6 Hard Success'}
              {history[0].checkResult === 'regular' && '\u25CF Regular Success'}
              {history[0].checkResult === 'fail' && '\u2717 Failure'}
              {history[0].checkResult === 'fumble' && '\u2620 FUMBLE!'}
              <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                (vs {history[0].skillTarget}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Roll History */}
      {history.length > 1 && (
        <div className="space-y-1">
          <h3 className="text-sm font-display text-[hsl(var(--muted-foreground))]">Roll History</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {history.slice(1).map((roll) => (
              <div
                key={roll.id}
                className="flex items-center justify-between px-3 py-1.5 bg-[hsl(var(--muted))]/50 rounded text-sm"
              >
                <span className="font-mono text-[hsl(var(--muted-foreground))]">
                  {roll.count}{roll.type}
                </span>
                <span className="font-bold">{roll.total}</span>
                {roll.checkResult && (
                  <span className={`text-xs font-display ${resultColors[roll.checkResult]}`}>
                    {roll.checkResult}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
