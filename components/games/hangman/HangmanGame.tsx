'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';

const HM_MAX = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

// Progressive gallows figure — one part per wrong guess (ported from week7.html).
const HM_PARTS: ((ctx: CanvasRenderingContext2D) => void)[] = [
  (ctx) => { ctx.beginPath(); ctx.arc(130, 55, 18, 0, Math.PI * 2); ctx.stroke(); }, // head
  (ctx) => { ctx.beginPath(); ctx.moveTo(130, 73); ctx.lineTo(130, 120); ctx.stroke(); }, // body
  (ctx) => { ctx.beginPath(); ctx.moveTo(130, 85); ctx.lineTo(105, 108); ctx.stroke(); }, // left arm
  (ctx) => { ctx.beginPath(); ctx.moveTo(130, 85); ctx.lineTo(155, 108); ctx.stroke(); }, // right arm
  (ctx) => { ctx.beginPath(); ctx.moveTo(130, 120); ctx.lineTo(108, 148); ctx.stroke(); }, // left leg
  (ctx) => { ctx.beginPath(); ctx.moveTo(130, 120); ctx.lineTo(152, 148); ctx.stroke(); }, // right leg
];

function drawHangman(canvas: HTMLCanvasElement | null, wrong: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#2D2A5E';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(20, 170); ctx.lineTo(160, 170); // base
  ctx.moveTo(60, 170); ctx.lineTo(60, 10); // pole
  ctx.moveTo(60, 10); ctx.lineTo(130, 10); // top
  ctx.moveTo(130, 10); ctx.lineTo(130, 37); // rope
  ctx.stroke();
  for (let i = 0; i < wrong && i < HM_PARTS.length; i++) HM_PARTS[i](ctx);
}

export function HangmanGame() {
  const { words } = useWordList();
  const { playWord } = usePhonicsAudio();
  const { playCorrect, playWrong } = useFeedbackSound();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [ended, setEnded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const current = questions[q];
  const letters = current ? current.word.split('') : [];
  const solved = current ? [...letters.keys()].every((i) => revealed.has(i)) : false;
  const lost = wrong >= HM_MAX;
  const roundOver = solved || lost;

  useEffect(() => {
    setGuessed(new Set());
    setRevealed(new Set());
    setWrong(0);
    setEnded(false);
  }, [q]);

  useEffect(() => {
    drawHangman(canvasRef.current, wrong);
  }, [wrong, q]);

  // Fire feedback + record result once a round ends.
  useEffect(() => {
    if (!current || ended || !roundOver) return;
    setEnded(true);
    if (solved) {
      setScore((s) => s + 1);
      playCorrect();
    } else {
      playWrong();
    }
    setResults((r) => [...r, { word: current.word, correct: solved }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundOver, current, ended]);

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

  const nextIdx = letters.findIndex((_, i) => !revealed.has(i));

  const guess = (letter: string) => {
    if (guessed.has(letter) || roundOver) return;
    if (nextIdx === -1) return;
    if (letter === letters[nextIdx]) {
      setRevealed((r) => new Set(r).add(nextIdx));
      setGuessed(new Set()); // correct letter clears the round's wrong marks
    } else {
      setGuessed((g) => new Set(g).add(letter));
      setWrong((w) => w + 1);
    }
  };

  return (
    <GameShell title="Hangman" icon="🪤" score={score} progress={q / questions.length}>
      <div style={{ textAlign: 'center' }}>
        <p className="hangman-hint">{current.def ? `"${current.def}"` : ' '}</p>
        <canvas ref={canvasRef} className="hangman-svg" width={180} height={175} />
        <p className="hangman-misses">
          Wrong guesses: {wrong} / {HM_MAX}
        </p>
        <div className="hangman-word-row">
          {letters.map((l, i) => {
            if (revealed.has(i)) {
              return (
                <div key={i} className="hangman-letter-slot revealed">
                  {l.toUpperCase()}
                </div>
              );
            }
            if (i === nextIdx && !roundOver) {
              return (
                <div
                  key={i}
                  className="hangman-letter-slot"
                  style={{ borderBottomColor: 'var(--primary)', boxShadow: '0 2px 0 var(--primary)' }}
                >
                  ?
                </div>
              );
            }
            return (
              <div key={i} className="hangman-letter-slot" style={{ opacity: 0.35 }}>
                {roundOver ? l.toUpperCase() : '_'}
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-secondary btn-sm"
          style={{ margin: '10px auto 6px' }}
          onClick={() => playWord(current.word, current.audioUrl)}
        >
          🔊 Hear the word
        </button>

        {roundOver ? (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: solved ? 'var(--green)' : 'var(--accent)',
                marginBottom: 12,
              }}
            >
              {solved ? '🎉 You got it!' : `😅 The word was "${current.word}"`}
            </div>
            <button className="btn btn-primary" onClick={() => setQ((n) => n + 1)}>
              Next →
            </button>
          </div>
        ) : (
          <div className="scramble-letters">
            {ALPHABET.map((l) => {
              const wrongKey = guessed.has(l);
              return (
                <button
                  key={l}
                  className={`letter-tile${wrongKey ? ' used' : ''}`}
                  disabled={wrongKey}
                  onClick={() => guess(l)}
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </GameShell>
  );
}
