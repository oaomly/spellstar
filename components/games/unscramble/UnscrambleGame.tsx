'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { Feedback } from '@/components/common/Feedback';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';

interface Tile {
  id: number;
  ch: string;
  used: boolean;
}

interface DragState {
  id: number;
  ch: string;
  x: number;
  y: number;
}

export function UnscrambleGame() {
  const { words } = useWordList();
  const { playWord } = usePhonicsAudio();
  const { playCorrect, playWrong } = useFeedbackSound();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words, 6), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [source, setSource] = useState<Tile[]>([]);
  const [answer, setAnswer] = useState<Tile[]>([]);
  const [fb, setFb] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false });

  const dropRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ id: number; startX: number; startY: number; moved: boolean } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const current = questions[q];

  useEffect(() => {
    if (!current) return;
    const letters = current.word.split('');
    let tiles = shuffle(letters).map((ch, i) => ({ id: i, ch, used: false }));
    if (letters.length > 1 && tiles.map((t) => t.ch).join('') === current.word) {
      tiles = shuffle(tiles);
    }
    setSource(tiles);
    setAnswer([]);
    playWord(current.word, current.audioUrl);
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

  const place = (id: number) => {
    const tile = source.find((t) => t.id === id);
    if (!tile || tile.used) return;
    setSource((s) => s.map((x) => (x.id === id ? { ...x, used: true } : x)));
    setAnswer((a) => [...a, tile]);
  };

  const unplace = (tile: Tile) => {
    setSource((s) => s.map((x) => (x.id === tile.id ? { ...x, used: false } : x)));
    setAnswer((a) => a.filter((x) => x.id !== tile.id));
  };

  // Pointer drag/drop — works with mouse and touch (iPad). A short press that
  // doesn't move counts as a tap and also places the tile.
  const onPointerDown = (e: React.PointerEvent, tile: Tile) => {
    if (tile.used) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragInfo.current = { id: tile.id, startX: e.clientX, startY: e.clientY, moved: false };
    setDrag({ id: tile.id, ch: tile.ch, x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const info = dragInfo.current;
    if (!info) return;
    if (Math.abs(e.clientX - info.startX) > 6 || Math.abs(e.clientY - info.startY) > 6) info.moved = true;
    setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const info = dragInfo.current;
    if (!info) return;
    const dz = dropRef.current?.getBoundingClientRect();
    const overZone =
      !!dz && e.clientX >= dz.left && e.clientX <= dz.right && e.clientY >= dz.top && e.clientY <= dz.bottom;
    if (overZone || !info.moved) place(info.id);
    dragInfo.current = null;
    setDrag(null);
  };

  const check = () => {
    const guess = answer.map((t) => t.ch).join('');
    const isCorrect = guess === current.word;
    if (isCorrect) {
      setScore((s) => s + 1);
      playCorrect();
    } else {
      playWrong();
    }
    setResults((r) => [...r, { word: current.word, correct: isCorrect }]);
    setFb({ show: true, correct: isCorrect });
    setTimeout(() => {
      setFb({ show: false, correct: isCorrect });
      setQ((n) => n + 1);
    }, 1500);
  };

  return (
    <GameShell title="Unscramble" icon="🔀" score={score} progress={q / questions.length}>
      <p className="mc-prompt">Drag the letters into the box in the right order</p>
      <button
        className="btn btn-secondary btn-sm"
        style={{ display: 'block', margin: '0 auto 8px' }}
        onClick={() => playWord(current.word, current.audioUrl)}
      >
        🔊 Hear it
      </button>

      <div ref={dropRef} className="answer-tiles" aria-label="Answer box">
        {answer.length === 0 && <span style={{ color: 'var(--text2)', fontSize: 14 }}>drop letters here</span>}
        {answer.map((t) => (
          <button key={t.id} className="answer-tile" onClick={() => unplace(t)}>
            {t.ch}
          </button>
        ))}
      </div>

      <div className="scramble-letters">
        {source.map((t) => (
          <button
            key={t.id}
            className={`letter-tile${t.used ? ' used' : ''}${drag?.id === t.id ? ' dragging' : ''}`}
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => onPointerDown(e, t)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {t.ch}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn btn-primary" disabled={answer.length !== current.word.length} onClick={check}>
          Check ✓
        </button>
      </div>

      {drag && (
        <div
          className="letter-tile drag-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          {drag.ch}
        </div>
      )}

      <Feedback show={fb.show} correct={fb.correct} word={current.word} />
    </GameShell>
  );
}
