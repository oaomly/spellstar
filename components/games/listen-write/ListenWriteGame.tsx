'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { buildQuestionSet } from '@/lib/gameEngine/helpers';
import { recognizeHandwriting } from '@/lib/ocr/recognize';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { useSpeech } from '@/lib/tts/useSpeech';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';

type Phase = 'draw' | 'checking' | 'revealed';

export function ListenWriteGame() {
  const { words, isCustomized } = useWordList();
  const { settings } = useSettings();
  const { speak } = useSpeech();
  const { playCorrect, playWrong } = useFeedbackSound();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestionSet(words, 6), [words, seed]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [phase, setPhase] = useState<Phase>('draw');
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  const current = questions[q];

  // Owner's proxy is only offered for bundled default content.
  const allowProxy = !isCustomized;

  useEffect(() => {
    setPhase('draw');
    setOcrText(null);
    setNote('');
    clearCanvas();
    if (current) speak(current.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, current?.id]);

  function clearCanvas() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    hasInk.current = false;
  }

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (c.width / rect.width), y: (e.clientY - rect.top) * (c.height / rect.height) };
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'draw') return;
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2D2A5E';
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  };
  const end = () => {
    drawing.current = false;
  };

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

  const record = (correct: boolean) => {
    if (correct) {
      setScore((s) => s + 1);
      playCorrect();
    } else {
      playWrong();
    }
    setResults((r) => [...r, { word: current.word, correct }]);
    setTimeout(() => setQ((n) => n + 1), 700);
  };

  // "Try again" — redo the SAME word: reset to a blank canvas and re-speak it,
  // without recording a result or advancing.
  const retry = () => {
    playWrong();
    setPhase('draw');
    setOcrText(null);
    setNote('');
    clearCanvas();
    speak(current.word);
  };

  const check = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasInk.current) {
      setNote('Draw the word first! ✏️');
      return;
    }
    setPhase('checking');
    setNote('Reading your writing…');
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    try {
      const { text } = await recognizeHandwriting(base64, {
        ownKey: settings.visionApiKey,
        allowProxy,
      });
      setOcrText(text);
      const correct = text === current.word.toLowerCase();
      setPhase('revealed');
      setNote('');
      if (correct) {
        speak(current.word);
        record(true);
      }
      // if wrong, stay revealed and let them see the answer + self-report
    } catch {
      // No OCR available -> self-check flow.
      setPhase('revealed');
      setOcrText(null);
      setNote('');
    }
  };

  const showAnswerOnly = () => {
    setPhase('revealed');
    setOcrText(null);
  };

  return (
    <GameShell title="Listen & Write" icon="🎧" score={score} progress={q / questions.length}>
      <div className="listen-write-area">
        <button className="listen-word-btn" onClick={() => speak(current.word)} aria-label="Hear the word">
          <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
        </button>
        <p className="mc-prompt">Listen, then write the word below</p>

        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            width={480}
            height={200}
            className="write-canvas"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>

        <div className="canvas-toolbar">
          <button className="tool-btn" onClick={clearCanvas} disabled={phase !== 'draw'}>
            🧽 Clear
          </button>
          {phase === 'draw' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={check}>
                ✓ Check my writing
              </button>
              <button className="btn btn-secondary btn-sm" onClick={showAnswerOnly}>
                👀 Show word
              </button>
            </>
          )}
        </div>

        {note && <div className="recognize-result">{note}</div>}

        {phase === 'revealed' && (
          <div>
            {ocrText !== null && (
              <div className={`recognize-result ${ocrText === current.word.toLowerCase() ? 'correct' : 'wrong'}`}>
                {ocrText ? `I read: "${ocrText}"` : "I couldn't read it clearly"}
              </div>
            )}
            <div className="reveal-word">{current.word}</div>
            {!(ocrText && ocrText === current.word.toLowerCase()) && (
              <>
                <p className="phonics-hint">Compare with what you wrote — did you get it right?</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                  <button className="btn btn-green" onClick={() => record(true)}>
                    ✅ I got it right
                  </button>
                  <button className="btn btn-danger" onClick={retry}>
                    🔁 Try again
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
}
