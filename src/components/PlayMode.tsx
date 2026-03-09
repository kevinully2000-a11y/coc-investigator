import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import type { Investigator, ChatMessage, Scenario, MoodType } from '../lib/types';
import { SCENARIOS, rollDice, checkResult } from '../lib/gameData';
import { streamGameMaster } from '../lib/api';
import { startAmbient, stopAmbient, changeMood, stopSpeech, speakText, setSpeechEnabled } from '../lib/audio';
import Button from './Button';

interface Props {
  investigator: Investigator | null;
  onNeedInvestigator: () => void;
}

export default function PlayMode({ investigator, onNeedInvestigator }: Props) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sanity, setSanity] = useState(investigator?.derived.SAN ?? 0);
  const [hp, setHp] = useState(investigator?.derived.HP ?? 0);
  const [gameOver, setGameOver] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const [narrationOn, setNarrationOn] = useState(true);
  const [mood, setMood] = useState<MoodType>('calm');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (investigator) {
      setSanity(investigator.derived.SAN);
      setHp(investigator.derived.HP);
    }
  }, [investigator]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => { stopAmbient(); stopSpeech(); }, []);

  const toggleAmbient = useCallback(() => {
    if (ambientOn) {
      stopAmbient();
      setAmbientOn(false);
    } else {
      startAmbient(mood);
      setAmbientOn(true);
    }
  }, [ambientOn, mood]);

  const toggleNarration = useCallback(() => {
    const next = !narrationOn;
    setNarrationOn(next);
    setSpeechEnabled(next);
    if (!next) stopSpeech();
  }, [narrationOn]);

  const parseMood = (text: string): MoodType | null => {
    const match = text.match(/\*\*MOOD:\s*(calm|tense|dread|panic|otherworldly)\*\*/);
    return match ? (match[1] as MoodType) : null;
  };

  const startScenario = (s: Scenario) => {
    if (!investigator) {
      onNeedInvestigator();
      return;
    }
    setScenario(s);
    setMessages([]);
    setGameOver(false);
    setSanity(investigator.derived.SAN);
    setHp(investigator.derived.HP);
    startAmbient('tense');
    setAmbientOn(true);
    setMood('tense');

    const firstMsg: ChatMessage = {
      role: 'user',
      content: 'Begin the scenario. Set the scene and give me my first choices.',
    };
    setMessages([firstMsg]);
    sendToKeeper([firstMsg], s);
  };

  const sendToKeeper = (msgs: ChatMessage[], scn: Scenario) => {
    setIsStreaming(true);
    stopSpeech();
    let fullText = '';

    streamGameMaster({
      messages: msgs,
      scenario: scn,
      investigator: investigator!,
      onDelta: (delta) => {
        fullText += delta;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: fullText } : m));
          }
          return [...prev, { role: 'assistant', content: fullText }];
        });

        const detectedMood = parseMood(fullText);
        if (detectedMood) {
          setMood(detectedMood);
          changeMood(detectedMood);
        }
      },
      onDone: () => {
        setIsStreaming(false);
        if (narrationOn) speakText(fullText);

        if (fullText.includes('**GAME_OVER:')) {
          setGameOver(true);
          changeMood('calm');
        }

        // Handle SAN checks
        const sanMatch = fullText.match(/\*\*SAN_CHECK:\s*(\d+)d(\d+)\*\*/);
        if (sanMatch) {
          const dice = parseInt(sanMatch[1]);
          const sides = parseInt(sanMatch[2]);
          const roll = rollDice('d100', 1)[0];

          if (roll <= sanity) {
            toast.success(`SAN Check Passed! Rolled ${roll} vs ${sanity}.`);
          } else {
            const loss = Array.from({ length: dice }, () => Math.floor(Math.random() * sides) + 1).reduce(
              (a, b) => a + b,
              0
            );
            setSanity((prev) => Math.max(0, prev - loss));
            toast.error(`SAN Check Failed! Rolled ${roll} vs ${sanity}. Lost ${loss} Sanity.`);
          }
        }
      },
      onError: (msg) => {
        setIsStreaming(false);
        toast.error(msg);
      },
    });
  };

  const sendMessage = (content: string) => {
    if (isStreaming || gameOver) return;
    stopSpeech();
    const msg: ChatMessage = { role: 'user', content };
    const updated = [...messages, msg];
    setMessages(updated);
    sendToKeeper(updated, scenario!);
  };

  const handleSkillRoll = (skillName: string) => {
    if (!investigator) return;
    const skill = investigator.skills.find((s) => s.name.toLowerCase().includes(skillName.toLowerCase()));
    const target = skill?.value ?? 1;
    const roll = rollDice('d100', 1)[0];
    const result = checkResult(roll, target);

    const labels: Record<string, string> = {
      critical: '\u{1F3AF} Critical Success!',
      extreme: '\u{1F4A5} Extreme Success!',
      hard: '\u2728 Hard Success!',
      regular: '\u2705 Regular Success',
      fail: '\u274C Failure',
      fumble: '\u{1F480} Fumble!',
    };

    const success = result !== 'fail' && result !== 'fumble';
    toast(`${skillName}: Rolled ${roll} vs ${target}% \u2014 ${labels[result]}`, { duration: 5000 });
    sendMessage(
      `[I attempt a ${skillName} check. I rolled ${roll} against my skill of ${target}%. Result: ${result}. ${success ? 'I succeed.' : 'I fail.'}]`
    );
  };

  const cleanMoodTags = (text: string) =>
    text.replace(/\*\*MOOD:\s*(?:calm|tense|dread|panic|otherworldly)\*\*\n?/g, '');

  // Parse choices and skill checks from last assistant message
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  const choices: string[] = [];
  if (lastAssistant && !isStreaming) {
    const re = /^\d+\.\s+(.+)$/gm;
    let match;
    while ((match = re.exec(lastAssistant.content)) !== null) {
      choices.push(match[1]);
    }
  }

  const skillChecks: string[] = [];
  if (lastAssistant && !isStreaming) {
    const re = /\*\*SKILL_CHECK:\s*([^\s*]+(?:\s+[^\s*]+)*)\s+(?:regular|hard|extreme)\*\*/g;
    let match;
    while ((match = re.exec(lastAssistant.content)) !== null) {
      skillChecks.push(match[1]);
    }
  }

  const moodColors: Record<MoodType, string> = {
    calm: 'text-[hsl(var(--primary))]',
    tense: 'text-[hsl(var(--secondary))]',
    dread: 'text-[hsl(var(--destructive))]',
    panic: 'text-[hsl(var(--destructive))] animate-pulse',
    otherworldly: 'text-eldritch-glow',
  };

  // ─── Scenario Selection ───
  if (!scenario) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-bold text-eldritch-glow">Choose Your Nightmare</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            {investigator
              ? `Playing as ${investigator.name}, ${investigator.occupation}`
              : "You'll need an investigator first"}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-1">
            &#x1F50A; Ambient audio &amp; voice narration included
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => startScenario(s)}
              className="parchment-surface rounded-md p-6 text-left hover:eldritch-glow transition-shadow group cursor-pointer"
            >
              <div className="text-4xl mb-3">{s.coverEmoji}</div>
              <h3 className="font-display font-bold text-lg text-eldritch-glow group-hover:text-[hsl(var(--primary))] transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 italic">{s.tagline}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {s.themes.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full text-[hsl(var(--muted-foreground))]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {!investigator && (
          <div className="text-center">
            <Button onClick={onNeedInvestigator} className="font-display">
              &#x2726; Create an Investigator First
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── Active Game ───
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 parchment-surface rounded-t-md border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setScenario(null);
              setMessages([]);
              setGameOver(false);
              stopAmbient();
              stopSpeech();
              setAmbientOn(false);
            }}
            className="font-display text-xs"
          >
            &larr; Exit
          </Button>
          <span className="font-display font-bold text-sm text-eldritch-glow">{scenario.title}</span>
          <span className={`text-[10px] font-mono uppercase ${moodColors[mood]}`}>&#x25CF; {mood}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAmbient}
            title={ambientOn ? 'Mute ambient' : 'Play ambient'}
          >
            {ambientOn ? '\u{1F50A}' : '\u{1F507}'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNarration}
            title={narrationOn ? 'Mute narration' : 'Enable narration'}
          >
            {narrationOn ? '\u{1F399}' : '\u{1F515}'}
          </Button>
          <div className="flex gap-3 text-xs font-mono">
            <span>
              SAN: <strong className={sanity < 20 ? 'text-blood' : ''}>{sanity}</strong>
            </span>
            <span>
              HP: <strong className={hp < 3 ? 'text-blood' : ''}>{hp}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[hsl(var(--background))]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${
              msg.role === 'user'
                ? 'ml-auto max-w-[80%] bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 rounded-lg p-3'
                : 'max-w-full prose-sm'
            }`}
          >
            {msg.role === 'assistant' ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="text-[hsl(var(--foreground))] leading-relaxed mb-3">{children}</p>
                  ),
                  strong: ({ children }) => {
                    if (String(children).startsWith('MOOD:')) return null;
                    if (String(children).startsWith('SAN_CHECK:')) return null;
                    if (String(children).startsWith('SKILL_CHECK:')) return null;
                    if (String(children).startsWith('GAME_OVER:')) return null;
                    return <strong className="text-eldritch-glow font-bold">{children}</strong>;
                  },
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 text-[hsl(var(--primary))]">{children}</ol>
                  ),
                  li: ({ children }) => <li className="text-[hsl(var(--foreground))]">{children}</li>,
                }}
              >
                {cleanMoodTags(msg.content)}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-[hsl(var(--foreground))]">{msg.content}</p>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-sm font-mono">
            <span className="animate-pulse">The Keeper speaks...</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 parchment-surface rounded-b-md border-t border-[hsl(var(--border))] space-y-3">
        {gameOver ? (
          <div className="text-center space-y-3">
            <p className="font-display text-lg text-[hsl(var(--secondary))]">The story has ended.</p>
            <Button
              onClick={() => {
                setScenario(null);
                setMessages([]);
                setGameOver(false);
                stopAmbient();
                stopSpeech();
                setAmbientOn(false);
              }}
              className="font-display"
            >
              Choose Another Scenario
            </Button>
          </div>
        ) : (
          <>
            {skillChecks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] self-center">Roll:</span>
                {skillChecks.map((skill) => (
                  <Button
                    key={skill}
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSkillRoll(skill)}
                    disabled={isStreaming}
                    className="font-mono text-xs"
                  >
                    &#x1F3B2; {skill}
                  </Button>
                ))}
              </div>
            )}

            {choices.length > 0 && (
              <div className="grid gap-2">
                {choices.map((choice, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    onClick={() => sendMessage(choice)}
                    disabled={isStreaming}
                    className="text-left justify-start h-auto py-2 px-4 font-body text-sm whitespace-normal"
                  >
                    <span className="font-mono text-[hsl(var(--primary))] mr-2">{i + 1}.</span>
                    {choice}
                  </Button>
                ))}
              </div>
            )}

            {!isStreaming && choices.length === 0 && !skillChecks.length && messages.length > 1 && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] text-center font-mono">
                Waiting for the Keeper...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
