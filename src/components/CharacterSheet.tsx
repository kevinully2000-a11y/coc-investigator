import type { Investigator } from '../lib/types';
import Button from './Button';

interface Props {
  investigator: Investigator;
}

export default function CharacterSheet({ investigator }: Props) {
  const { characteristics, derived, skills } = investigator;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="parchment-surface rounded-md p-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-display font-bold text-eldritch-glow">{investigator.name}</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {investigator.occupation} &bull; {investigator.era} &bull; Age {investigator.age}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {investigator.residence} &mdash; born in {investigator.birthplace}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print-hidden shrink-0">
          &#x1F5A8; Print
        </Button>
      </div>

      {/* Characteristics */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {Object.entries(characteristics).map(([key, val]) => (
          <div key={key} className="parchment-surface rounded-md p-3 text-center">
            <div className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {key}
            </div>
            <div className="text-xl font-display font-bold">{val}</div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {Math.floor(val / 2)} / {Math.floor(val / 5)}
            </div>
          </div>
        ))}
      </div>

      {/* Derived Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(derived).map(([key, val]) => (
          <div
            key={key}
            className="bg-[hsl(var(--muted))] rounded-md p-3 text-center border border-[hsl(var(--border))]"
          >
            <div className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {key}
            </div>
            <div className="text-lg font-display font-bold text-[hsl(var(--secondary))]">{val}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="parchment-surface rounded-md p-6">
        <h3 className="font-display font-bold text-lg mb-4 text-eldritch-glow">Skills</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex justify-between items-baseline py-1 border-b border-[hsl(var(--border))]/40"
            >
              <span className="text-sm truncate mr-2">{skill.name}</span>
              <span
                className={`text-sm font-mono font-bold ${
                  skill.value > skill.base
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))]'
                }`}
              >
                {skill.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
