import { useState } from 'react';
import { Toaster } from 'sonner';
import type { Investigator, TabType } from './lib/types';
import CreateInvestigator from './components/CreateInvestigator';
import CharacterSheet from './components/CharacterSheet';
import DiceRoller from './components/DiceRoller';
import PlayMode from './components/PlayMode';
import Button from './components/Button';

export default function App() {
  const [tab, setTab] = useState<TabType>('home');
  const [investigator, setInvestigator] = useState<Investigator | null>(null);

  const handleCreate = (inv: Investigator) => {
    setInvestigator(inv);
    setTab('sheet');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(200 12% 12%)',
            color: 'hsl(45 20% 85%)',
            border: '1px solid hsl(200 10% 20%)',
          },
        }}
      />

      {/* Suite Navigation */}
      <nav className="bg-[#1e293b] h-10 flex items-center px-4 z-50">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <a
            href="https://medicalpkm.com"
            className="flex items-center gap-1.5 text-white no-underline text-sm font-semibold tracking-tight"
          >
            <span className="text-amber-400 font-bold">&#9672;</span>
            <span>MedicalPKM</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-300 text-sm font-medium">Cthulhu Investigator</span>
          </a>
          <div className="flex items-center gap-1">
            <a
              href="https://kol.medicalpkm.com"
              className="text-slate-400 no-underline text-xs font-medium px-2 py-1 rounded hover:text-white hover:bg-white/10 transition-colors"
            >
              KOL Briefs
            </a>
            <a
              href="https://medicalpkm.com/apps/shared/fountain-pen/"
              className="text-slate-400 no-underline text-xs font-medium px-2 py-1 rounded hover:text-white hover:bg-white/10 transition-colors"
            >
              Fountain Pen
            </a>
          </div>
        </div>
      </nav>

      {/* App Navigation */}
      <nav className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm sticky top-10 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-12 px-4">
          <button
            onClick={() => setTab('home')}
            className="font-cthulhu text-lg text-[hsl(var(--blood))] tracking-tight cursor-pointer bg-transparent border-none"
          >
            &#x2726; Call of Cthulhu
          </button>

          <div className="flex gap-1">
            <Button
              variant={tab === 'play' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab('play')}
              className="font-display text-xs"
            >
              &#x25B6; Play
            </Button>
            <Button
              variant={tab === 'create' || tab === 'sheet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab(investigator ? 'sheet' : 'create')}
              className="font-display text-xs"
            >
              Investigator
            </Button>
            <Button
              variant={tab === 'dice' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab('dice')}
              className="font-display text-xs"
            >
              Dice
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-8">
        {/* Home */}
        {tab === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-10 px-6 animate-fade-in-up">
            <div className="space-y-5">
              <h1 className="text-5xl sm:text-7xl text-cthulhu-title leading-tight">
                Call of Cthulhu
              </h1>
              <p className="text-xl font-display text-[hsl(var(--secondary))] tracking-wide">
                AI-Generated Adventures
              </p>
              <p className="text-[hsl(var(--muted-foreground))] max-w-lg mx-auto leading-relaxed">
                Play solo horror adventures with an AI Keeper, generate investigators,
                and roll your fate. AI-generated Call of Cthulhu RPG adventures.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => setTab('play')} className="font-display px-8">
                &#x25B6; Play a Scenario
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setTab('create')}
                className="font-display px-8 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]"
              >
                &#x2726; Create Investigator
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setTab('dice')}
                className="font-display px-8 border-[hsl(var(--secondary))] text-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary-foreground))]"
              >
                &#x1F3B2; Dice Roller
              </Button>
            </div>

            <div className="pt-10">
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono opacity-40 tracking-[0.25em] italic">
                &ldquo; Ph&rsquo;nglui mglw&rsquo;nafh Cthulhu R&rsquo;lyeh wgah&rsquo;nagl fhtagn &rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Play */}
        {tab === 'play' && <PlayMode investigator={investigator} onNeedInvestigator={() => setTab('create')} />}

        {/* Create */}
        {tab === 'create' && <CreateInvestigator onComplete={handleCreate} />}

        {/* Sheet */}
        {tab === 'sheet' && investigator && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTab('create')}
              className="font-display text-xs"
            >
              &larr; New Investigator
            </Button>
            <CharacterSheet investigator={investigator} />
          </div>
        )}

        {/* Dice */}
        {tab === 'dice' && <DiceRoller />}
      </main>
    </div>
  );
}
