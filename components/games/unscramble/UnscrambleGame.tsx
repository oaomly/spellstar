'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { useSpeech } from '@/lib/tts/useSpeech';

interface Tile {
  id: number;
  ch: string;
  used: boolean;
}

export function UnscrambleGame() {
  const { words } = useWordList();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words, 6), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [source, setSource] = useState<Tile[]>([]);
  const [answer, setAnswer] = useState<Tile[]>([]);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });
  const { speak } = useSpeech();

  const current = questions[q];

  useEffect(() => {
    if (!current) return;
    const letters = current.word.split('');
    let tiles = shuffle(letters).map((ch, i) => ({ id: i, ch, used: false }));
    // avoid the shuffle accidentally equalling the word
    if (tiles.map((t) => t.ch).join('') === current.word && letters.length > 1) {
      tiles = shuffle(tiles);
    }
    setSource(tiles);
    setAnswer([]);
    speak(current.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  if (q >= questions.length) {
    return (
      <ResultsScreen
        score={score}
        total={questions.length}
        results={results}
        onPlayAgain={() => {
          setSeed((s) => s + 1);
          setQ(0);
          setScore(0);
          setResults([]);
        }}
      />
    );
  }

  const pick = (t: Tile) => {
    if (t.used) return;
    setSource((s) => s.map((x) => (x.id === t.id ? { ...x, used: true } : x)));
    setAnswer((a) => [...a, t]);
  };

  const unpick = (t: Tile) => {
    setSource((s) => s.map((x) => (x.id === t.id ? { ...x, used: false } : x)));
    setAnswer((a) => a.filter((x) => x.id !== t.id));
  };

  const check = () => {
    const guess = answer.map((t) => t.ch).join('');
    const isCorrect = guess === current.word;
    if (isCorrect) setScore((s) => s + 1);
    setResults((r) => [...r, { word: current.word, correct: isCorrect }]);
    setFb({ show: true, correct: isCorrect });
    speak(current.word);
    setTimeout(() => {
      setFb({ show: false, correct: isCorrect });
      setQ((n) => n + 1);
    }, 1400);
  };

  return (
    <GameShell title="Unscramble" icon="🔀" score={score} progress={q / questions.length}>
      <p className="mc-prompt">Tap the letters in order to spell the word</p>
      <button className="btn btn-secondary btn-sm" style={{ display: 'block', margin: '0 auto 8px' }} onClick={() => speak(current.word)}>
        🔊 Hear it
      </button>
      <div className="answer-tiles">
        {answer.map((t) => (
          <button key={t.id} className="answer-tile" onClick={() => unpick(t)}>
            {t.ch}
          </button>
        ))}
      </div>
      <div className="scramble-letters">
        {source.map((t) => (
          <button key={t.id} className={`letter-tile${t.used ? ' used' : ''}`} onClick={() => pick(t)}>
            {t.ch}
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn btn-primary" disabled={answer.length !== current.word.length} onClick={check}>
          Check ✓
        </button>
      </div>
      <Feedback show={fb.show} correct={fb.correct} word={current.word} />
    </GameShell>
  );
}
