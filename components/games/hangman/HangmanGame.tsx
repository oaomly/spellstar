'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { useSpeech } from '@/lib/tts/useSpeech';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const MAX_MISSES = 6;

export function HangmanGame() {
  const { words } = useWordList();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words, 6), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);
  const { speak } = useSpeech();

  const current = questions[q];

  useEffect(() => {
    setGuessed(new Set());
    setMisses(0);
  }, [q]);

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

  const letters = current.word.split('');
  const uniqueLetters = new Set(letters.filter((c) => /[a-z]/i.test(c)));
  const solved = [...uniqueLetters].every((c) => guessed.has(c));
  const lost = misses >= MAX_MISSES;
  const roundOver = solved || lost;

  const guess = (ch: string) => {
    if (guessed.has(ch) || roundOver) return;
    const next = new Set(guessed);
    next.add(ch);
    setGuessed(next);
    if (!current.word.includes(ch)) {
      setMisses((m) => m + 1);
    } else if ([...uniqueLetters].every((c) => next.has(c))) {
      // just solved
      speak(current.word);
    }
  };

  const nextRound = () => {
    const won = solved;
    if (won) setScore((s) => s + 1);
    setResults((r) => [...r, { word: current.word, correct: won }]);
    setQ((n) => n + 1);
  };

  return (
    <GameShell title="Hangman" icon="🪤" score={score} progress={q / questions.length}>
      <p className="hangman-hint">Hint: {current.def || current.sentence || 'Guess the word!'}</p>
      <p className="hangman-misses">
        {'❤️'.repeat(MAX_MISSES - misses)}
        {'🖤'.repeat(misses)}
      </p>

      <div className="hangman-word-row">
        {letters.map((c, i) => {
          const isLetter = /[a-z]/i.test(c);
          const show = !isLetter || guessed.has(c) || roundOver;
          return (
            <span key={i} className={`hangman-letter-slot${show ? ' revealed' : ''}`}>
              {show ? c : ''}
            </span>
          );
        })}
      </div>

      {roundOver ? (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: solved ? 'var(--green)' : 'var(--accent)', marginBottom: 12 }}>
            {solved ? '🎉 You got it!' : `😅 The word was "${current.word}"`}
          </div>
          <button className="btn btn-primary" onClick={nextRound}>
            Next →
          </button>
        </div>
      ) : (
        <div className="hangman-keyboard">
          {ALPHABET.map((ch) => {
            const used = guessed.has(ch);
            const correct = used && current.word.includes(ch);
            return (
              <button
                key={ch}
                className={`hm-key${used ? (correct ? ' correct' : ' wrong') : ''}`}
                disabled={used}
                onClick={() => guess(ch)}
              >
                {ch}
              </button>
            );
          })}
        </div>
      )}
    </GameShell>
  );
}
