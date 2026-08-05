'use client';

import { useMemo, useState } from 'react';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { useSpeech } from '@/lib/tts/useSpeech';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';

export function WordMatchGame() {
  const { words } = useWordList();
  const [seed, setSeed] = useState(0);
  const set = useMemo(() => buildQuestionSet(words), [words, seed]);
  const leftCol = useMemo(() => shuffle(set), [set]);
  const rightCol = useMemo(() => shuffle(set), [set]);
  const { speak } = useSpeech();
  const { playCorrect, playWrong } = useFeedbackSound();

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongId, setWrongId] = useState<string | null>(null);

  const done = matched.size === set.length && set.length > 0;

  if (done) {
    return (
      <ResultsScreen
        score={set.length}
        total={set.length}
        results={set.map((w) => ({ word: w.word, correct: true }))}
        onPlayAgain={() => {
          setSeed((s) => s + 1);
          setSelectedLeft(null);
          setMatched(new Set());
        }}
      />
    );
  }

  const clickLeft = (id: string) => {
    if (matched.has(id)) return;
    const w = set.find((x) => x.id === id);
    if (w) speak(w.word);
    setSelectedLeft(id);
  };

  const clickRight = (id: string) => {
    if (matched.has(id) || !selectedLeft) return;
    if (id === selectedLeft) {
      const next = new Set(matched);
      next.add(id);
      setMatched(next);
      setSelectedLeft(null);
      if (next.size === set.length) playCorrect();
    } else {
      setWrongId(id);
      setTimeout(() => setWrongId(null), 400);
      setSelectedLeft(null);
      playWrong();
    }
  };

  return (
    <GameShell title="Word Match" icon="🔗" score={matched.size} progress={matched.size / set.length}>
      <p className="mc-prompt">Match each word to its meaning</p>
      <div className="match-grid">
        <div className="match-col">
          <h3>Words</h3>
          {leftCol.map((w) => (
            <div
              key={w.id}
              className={`match-item${selectedLeft === w.id ? ' selected' : ''}${matched.has(w.id) ? ' matched' : ''}`}
              onClick={() => clickLeft(w.id)}
            >
              {w.word}
            </div>
          ))}
        </div>
        <div className="match-col">
          <h3>Meanings</h3>
          {rightCol.map((w) => (
            <div
              key={w.id}
              className={`match-item${matched.has(w.id) ? ' matched' : ''}${wrongId === w.id ? ' wrong-match' : ''}`}
              onClick={() => clickRight(w.id)}
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              {w.def || w.sentence || w.word}
            </div>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
