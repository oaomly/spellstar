'use client';

import { useMemo, useRef, useState } from 'react';
import type { GameResult, Word } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { useFeedbackSound } from '@/lib/tts/useFeedbackSound';
import { useHandTracking, type Tip } from './useHandTracking';

const DWELL_MS = 500; // hold the fingertip on a target this long to select it
type Side = 'left' | 'right';

export function FingerMatchGame() {
  const { words } = useWordList();
  const { playCorrect, playWrong } = useFeedbackSound();
  const [seed, setSeed] = useState(0);
  const roundWords = useMemo(() => buildQuestionSet(words), [words, seed]);
  const rightItems = useMemo(() => shuffle(roundWords), [roundWords]);

  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [camOn, setCamOn] = useState(false);

  const areaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const dwell = useRef<{ key: string | null; since: number; fired: boolean }>({ key: null, since: 0, fired: false });
  const hovered = useRef<HTMLElement | null>(null);
  const closePrev = useRef(false);

  const byId = (id: string) => roundWords.find((w) => w.id === id);
  const done = roundWords.length > 0 && matched.size >= roundWords.length;

  const activate = (side: Side, id: string) => {
    if (matched.has(id)) return;
    if (side === 'left') {
      setSelected(id);
      return;
    }
    // right: needs a selected word first
    if (!selected) return;
    setAttempts((a) => a + 1);
    if (id === selected) {
      setMatched((prev) => new Set(prev).add(id));
      setScore((s) => s + 1);
      const w = byId(id);
      if (w) setResults((r) => [...r, { word: w.word, correct: true }]);
      playCorrect();
      setSelected(null);
    } else {
      setWrong(id);
      playWrong();
      setTimeout(() => setWrong(null), 450);
      setSelected(null);
    }
  };

  // --- fingertip frame handler (called ~30–60×/s; avoids React state churn) ---
  const setHover = (el: HTMLElement | null) => {
    if (hovered.current === el) return;
    hovered.current?.classList.remove('ar-hover');
    el?.classList.add('ar-hover');
    hovered.current = el;
  };

  const hitTest = (tip: Tip): { side: Side; id: string; el: HTMLElement } | null => {
    for (const [key, el] of cardRefs.current) {
      const r = el.getBoundingClientRect();
      if (tip.x >= r.left && tip.x <= r.right && tip.y >= r.top && tip.y <= r.bottom) {
        const i = key.indexOf(':');
        return { side: key.slice(0, i) as Side, id: key.slice(i + 1), el };
      }
    }
    return null;
  };

  const onFrame = (tip: Tip | null, close: boolean) => {
    const cur = cursorRef.current;
    const line = lineRef.current;
    if (!tip) {
      if (cur) cur.style.opacity = '0';
      if (line) line.style.opacity = '0';
      setHover(null);
      dwell.current = { key: null, since: 0, fired: false };
      closePrev.current = false;
      return;
    }
    if (cur) {
      cur.style.opacity = '1';
      cur.classList.toggle('ar-cursor-pinch', close);
      cur.style.transform = `translate(${tip.x}px, ${tip.y}px)`;
    }

    const hit = hitTest(tip);
    const key = hit && !matched.has(hit.id) ? `${hit.side}:${hit.id}` : null;
    setHover(key ? hit!.el : null);

    // scissor-close (index+middle pinch) = instant lock on the current target
    if (close && !closePrev.current && hit && key) {
      dwell.current.fired = true;
      activate(hit.side, hit.id);
    }
    closePrev.current = close;

    // dwell → select
    const ts = performance.now();
    if (key !== dwell.current.key) {
      dwell.current = { key, since: ts, fired: false };
    } else if (key && !dwell.current.fired && ts - dwell.current.since > DWELL_MS) {
      dwell.current.fired = true;
      activate(hit!.side, hit!.id);
    }

    // connector line from the selected word card to the fingertip
    if (line) {
      const selEl = selected ? cardRefs.current.get(`left:${selected}`) : null;
      if (selEl) {
        const r = selEl.getBoundingClientRect();
        line.setAttribute('x1', String(r.right));
        line.setAttribute('y1', String(r.top + r.height / 2));
        line.setAttribute('x2', String(tip.x));
        line.setAttribute('y2', String(tip.y));
        line.style.opacity = '1';
      } else {
        line.style.opacity = '0';
      }
    }
  };

  const { status } = useHandTracking({ enabled: camOn, videoRef, onFrame });

  const setCardRef = (key: string) => (el: HTMLElement | null) => {
    if (el) cardRefs.current.set(key, el);
    else cardRefs.current.delete(key);
  };

  if (done) {
    return (
      <ResultsScreen
        score={score}
        total={roundWords.length}
        results={results}
        onPlayAgain={() => {
          setSeed((s) => s + 1);
          setSelected(null);
          setMatched(new Set());
          setScore(0);
          setAttempts(0);
          setResults([]);
        }}
      />
    );
  }

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 100;

  return (
    <GameShell title="Finger Match" icon="👆" score={score} progress={matched.size / (roundWords.length || 1)}>
      <p className="mc-prompt">
        Point at a word, then its picture — hold still for a moment, or pinch your index &amp;
        middle fingers together, to lock it. (Or just tap.)
      </p>
      <div className="ar-substat">🎯 {accuracy}% · {matched.size}/{roundWords.length} matched</div>

      <div ref={areaRef} className="ar-board">
        {camOn && (
          <video ref={videoRef} className="ar-video" muted playsInline autoPlay />
        )}

        <div className="ar-col ar-left">
          {roundWords.map((w) => (
            <button
              key={w.id}
              ref={setCardRef(`left:${w.id}`)}
              className={`ar-card${selected === w.id ? ' ar-selected' : ''}${matched.has(w.id) ? ' ar-matched' : ''}`}
              disabled={matched.has(w.id)}
              onClick={() => activate('left', w.id)}
            >
              <strong>{w.word}</strong>
              <span>{w.def || 'Match the picture'}</span>
            </button>
          ))}
        </div>

        <div className="ar-col ar-right">
          {rightItems.map((w) => (
            <button
              key={w.id}
              ref={setCardRef(`right:${w.id}`)}
              className={`ar-pic${matched.has(w.id) ? ' ar-matched' : ''}${wrong === w.id ? ' ar-wrong' : ''}`}
              disabled={matched.has(w.id)}
              onClick={() => activate('right', w.id)}
            >
              {w.gameImg || w.img ? <img src={w.gameImg || w.img} alt="" /> : <span>{w.emoji || '📷'}</span>}
            </button>
          ))}
        </div>

        {!camOn && (
          <div className="ar-overlay">
            <div className="ar-overlay-card">
              <div style={{ fontSize: 44 }}>👆</div>
              <h3>Finger Match</h3>
              <p>Turn on the camera to match with your finger, or just tap the cards.</p>
              <button className="btn btn-primary" onClick={() => setCamOn(true)}>
                📷 Start camera
              </button>
              <p className="phonics-hint" style={{ marginTop: 10 }}>
                The camera runs only on this device — nothing is uploaded.
              </p>
            </div>
          </div>
        )}
      </div>

      {camOn && status === 'loading' && <div className="ar-substat">Loading finger tracking…</div>}
      {camOn && status === 'denied' && (
        <div className="ar-substat">🎥 Camera blocked — you can still tap the cards to play.</div>
      )}
      {camOn && status === 'error' && (
        <div className="ar-substat">Finger tracking didn’t load — tap the cards to play.</div>
      )}

      {/* Fixed-position overlays in viewport space (match getBoundingClientRect coords). */}
      <svg className="ar-line-layer" aria-hidden="true">
        <line ref={lineRef} className="ar-line" style={{ opacity: 0 }} />
      </svg>
      <div ref={cursorRef} className="ar-cursor" style={{ opacity: 0 }} aria-hidden="true" />
    </GameShell>
  );
}
