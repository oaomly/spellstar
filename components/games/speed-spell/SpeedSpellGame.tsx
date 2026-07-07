'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';

const TIME_PER_WORD = 15;

export function SpeedSpellGame() {
  const { words } = useWordList();
  const { playWord } = usePhonicsAudio();
  const { playCorrect, playWrong } = useFeedbackSound();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words, 6), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [value, setValue] = useState('');
  const [time, setTime] = useState(TIME_PER_WORD);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });
  const [resolved, setResolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = questions[q];

  useEffect(() => {
    setValue('');
    setTime(TIME_PER_WORD);
    setResolved(false);
    if (current) playWord(current.word, current.audioUrl);
    setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, current?.id]);

  useEffect(() => {
    if (resolved || q >= questions.length) return;
    if (time <= 0) {
      resolve(false);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, resolved, q]);

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
          setStreak(0);
          setResults([]);
        }}
      />
    );
  }

  function resolve(correct: boolean) {
    if (resolved) return;
    setResolved(true);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setResults((r) => [...r, { word: current.word, correct }]);
    setFb({ show: true, correct });
    if (correct) playCorrect();
    else playWrong();
    setTimeout(() => {
      setFb({ show: false, correct });
      setQ((n) => n + 1);
    }, 1400);
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolved) return;
    resolve(value.trim().toLowerCase() === current.word.toLowerCase());
  };

  return (
    <GameShell title="Speed Spell" icon="⚡" score={score} progress={q / questions.length}>
      <p className="mc-prompt">Listen, then type the word fast!</p>
      <button className="btn btn-secondary btn-sm" style={{ display: 'block', margin: '0 auto 12px' }} onClick={() => playWord(current.word, current.audioUrl)}>
        🔊 Hear it again
      </button>
      <div className={`speed-timer${time <= 5 ? ' low' : ''}`}>⏱️ {time}s</div>
      <form onSubmit={submit}>
        <input
          ref={inputRef}
          className="speed-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={resolved}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="type here"
        />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={resolved || !value.trim()}>
            Submit
          </button>
        </div>
      </form>
      {streak >= 2 && <div className="streak-badge">🔥 {streak} in a row!</div>}
      <Feedback show={fb.show} correct={fb.correct} word={current.word} />
    </GameShell>
  );
}
