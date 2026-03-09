import { useState } from 'react';
import type { Investigator } from '../lib/types';
import {
  rollCharacteristics,
  calculateDerived,
  generateSkills,
  ERAS,
  OCCUPATIONS,
  getOccupationPoints,
  getPersonalInterestPoints,
} from '../lib/gameData';
import Button from './Button';
import Input from './Input';
import Select from './Select';

interface Props {
  onComplete: (investigator: Investigator) => void;
}

const INVESTIGATOR_PRESETS = [
  { name: 'Harvey Walters', age: 42, residence: 'Arkham, MA', birthplace: 'Boston, MA' },
  { name: 'Eleanor Marsh', age: 31, residence: 'Innsmouth, MA', birthplace: 'Kingsport, MA' },
  { name: 'Thomas Malone', age: 38, residence: 'Brooklyn, NY', birthplace: 'New York, NY' },
  { name: 'Agnes Baker', age: 27, residence: 'Salem, MA', birthplace: 'Providence, RI' },
  { name: 'Randolph Carter', age: 34, residence: 'Boston, MA', birthplace: 'Arkham, MA' },
  { name: 'Gloria Goldberg', age: 29, residence: 'Chicago, IL', birthplace: 'Philadelphia, PA' },
  { name: 'Silas Bishop', age: 45, residence: 'Dunwich, MA', birthplace: 'Aylesbury, MA' },
  { name: 'Miriam Beecher', age: 33, residence: 'Providence, RI', birthplace: 'Newport, RI' },
  { name: 'Jack Walters', age: 36, residence: 'Arkham, MA', birthplace: 'Hartford, CT' },
  { name: 'Daisy Walker', age: 24, residence: 'Cambridge, MA', birthplace: 'Concord, MA' },
  { name: 'Rex Murphy', age: 30, residence: 'New Orleans, LA', birthplace: 'Baton Rouge, LA' },
  { name: 'Vivian Atwood', age: 28, residence: 'San Francisco, CA', birthplace: 'Portland, OR' },
];

function randomPreset() {
  return INVESTIGATOR_PRESETS[Math.floor(Math.random() * INVESTIGATOR_PRESETS.length)];
}

export default function CreateInvestigator({ onComplete }: Props) {
  const [step, setStep] = useState<'info' | 'stats' | 'review'>('info');
  const [preset] = useState(randomPreset);
  const [name, setName] = useState(preset.name);
  const [age, setAge] = useState(preset.age);
  const [occupation, setOccupation] = useState('Private Investigator');
  const [era, setEra] = useState('1920s Classic');
  const [residence, setResidence] = useState(preset.residence);
  const [birthplace, setBirthplace] = useState(preset.birthplace);
  const [chars, setChars] = useState<ReturnType<typeof rollCharacteristics> | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setChars(rollCharacteristics());
      count++;
      if (count >= 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  const handleFinish = () => {
    if (!chars) return;
    const derived = calculateDerived(chars, age);
    const skills = generateSkills(chars);
    onComplete({
      name: name || 'Unknown Investigator',
      age,
      occupation,
      era,
      residence: residence || 'Arkham, MA',
      birthplace: birthplace || 'Unknown',
      characteristics: chars,
      derived,
      skills,
    });
  };

  const steps = ['info', 'stats', 'review'] as const;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold transition-all ${
                step === s
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] eldritch-glow'
                  : steps.indexOf(step) > i
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-12 h-px bg-[hsl(var(--border))]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 'info' && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h2 className="text-2xl font-display font-bold text-eldritch-glow mb-1">
              Who Are You, Investigator?
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Tell us about yourself before the madness begins...
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-display text-sm">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="font-display text-sm">Age</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                min={15}
                max={90}
              />
            </div>
            <div className="space-y-2">
              <label className="font-display text-sm">Era</label>
              <Select options={ERAS} value={era} onChange={(e) => setEra(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="font-display text-sm">Occupation</label>
              <Select options={OCCUPATIONS} value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="font-display text-sm">Residence</label>
              <Input value={residence} onChange={(e) => setResidence(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="font-display text-sm">Birthplace</label>
              <Input value={birthplace} onChange={(e) => setBirthplace(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep('stats')} className="font-display">
              Continue to Characteristics &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Roll Stats */}
      {step === 'stats' && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h2 className="text-2xl font-display font-bold text-eldritch-glow mb-1">
              Roll Your Fate
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              The dice determine your investigator's characteristics.
            </p>
          </div>

          <div className="text-center">
            <Button onClick={handleRoll} disabled={isRolling} size="lg" className="px-12 font-display">
              <span className={isRolling ? 'animate-dice-roll inline-block' : ''}>&#x1F3B2;</span>
              {' '}Roll Characteristics
            </Button>
          </div>

          {chars && (
            <div className="animate-fade-in-up space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                {Object.entries(chars).map(([key, val]) => (
                  <div key={key} className="parchment-surface rounded-md p-3 text-center">
                    <div className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      {key}
                    </div>
                    <div className="text-xl font-display font-bold">{val}</div>
                  </div>
                ))}
              </div>

              {/* Occupation Points info */}
              <div className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                Occupation Points: {getOccupationPoints(occupation, chars)} | Personal Interest Points:{' '}
                {getPersonalInterestPoints(chars)}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('info')} className="font-display text-xs">
                  &larr; Back
                </Button>
                <Button onClick={() => setStep('review')} className="font-display">
                  Review Investigator &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && chars && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h2 className="text-2xl font-display font-bold text-eldritch-glow mb-1">
              {name || 'Unknown Investigator'}
            </h2>
            <p className="text-[hsl(var(--muted-foreground))]">
              {occupation} &bull; {era} &bull; Age {age}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Review before the investigation begins.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {Object.entries(chars).map(([key, val]) => (
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

          {/* Derived stats preview */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(calculateDerived(chars, age)).map(([key, val]) => (
              <div key={key} className="bg-[hsl(var(--muted))] rounded-md p-3 text-center border border-[hsl(var(--border))]">
                <div className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  {key}
                </div>
                <div className="text-lg font-display font-bold text-[hsl(var(--secondary))]">{val}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('stats')} className="font-display text-xs">
              &larr; Back
            </Button>
            <Button onClick={handleFinish} size="lg" className="font-display px-8">
              &#x2726; Begin Investigation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
