'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { useSpeech } from '@/lib/tts/useSpeech';

interface Block {
  id: number;
  text: string;
  used: boolean;
}

export function WordBuilderGame() {
  const { words } = useWordList();
  const { speak } = useSpeech();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words, 6), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [bank, setBank] = useState<Block[]>([]);
  const [answer, setAnswer] = useState<Block[]>([]);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });

  const current = questions[q];
  // Tricky words have no chunks -> fall back to letters (pure memorization drill).
  const pieces = useMemo(() => {
    if (!current) return [] as string[];
    return current.tricky || current.chunks.length < 2
      ? current.word.split('')
      : current.chunks.map((c) => c.text);
  }, [current]);

  useEffect(() => {
    if (!current) return;
    setBank(shuffle(pieces).map((text, i) => ({ id: i, text, used: false })));
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

  const place = (b: Block) => {
    if (b.used) return;
    setBank((s) => s.map((x) => (x.id === b.id ? { ...x, used: true } : x)));
    setAnswer((a) => [...a, b]);
    speak(b.text);
  };

  const takeBack = (b: Block) => {
    setBank((s) => s.map((x) => (x.id === b.id ? { ...x, used: false } : x)));
    setAnswer((a) => a.filter((x) => x.id !== b.id));
  };

  const check = () => {
    const built = answer.map((b) => b.text).join('');
    const correct = built === current.word;
    if (correct) setScore((s) => s + 1);
    setResults((r) => [...r, { word: current.word, correct }]);
    setFb({ show: true, correct });
    if (correct) speak(current.word);
    setTimeout(() => {
      setFb({ show: false, correct });
      setQ((n) => n + 1);
    }, 1400);
  };

  const isPhonics = !current.tricky && current.chunks.length >= 2;

  return (
    <GameShell title="Word Builder" icon="🧱" score={score} progress={q / questions.length}>
      <p className="mc-prompt">
        {isPhonics ? 'Tap the sound blocks in order to build the word' : 'Tap the letters in order to build the word'}
      </p>
      <button className="btn btn-secondary btn-sm" style={{ display: 'block', margin: '0 auto 8px' }} onClick={() => speak(current.word)}>
        🔊 Hear it
      </button>
      <div className="answer-tiles">
        {answer.map((b) => (
          <button key={b.id} className="answer-tile" onClick={() => takeBack(b)}>
            {b.text}
          </button>
        ))}
      </div>
      <div className="scramble-letters">
        {bank.map((b) => (
          <button key={b.id} className={`letter-tile${b.used ? ' used' : ''}`} onClick={() => place(b)}>
            {b.text}
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn btn-primary" disabled={answer.length !== pieces.length} onClick={check}>
          Check ✓
        </button>
      </div>
      <Feedback show={fb.show} correct={fb.correct} word={current.word} />
    </GameShell>
  );
}
