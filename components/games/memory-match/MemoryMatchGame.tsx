'use client';

import { useMemo, useState } from 'react';
import { useWordList } from '@/components/providers/WordListProvider';
import { buildQuestionSet, shuffle } from '@/lib/gameEngine/helpers';
import { GameShell } from '../shared/GameShell';
import { ResultsScreen } from '../shared/ResultsScreen';
import { useSpeech } from '@/lib/tts/useSpeech';

interface Card {
  key: string;
  wordId: string;
  kind: 'word' | 'pic';
  label: string;
  isImg: boolean;
}

export function MemoryMatchGame() {
  const { words } = useWordList();
  const { speak } = useSpeech();
  const [seed, setSeed] = useState(0);

  const { deck, pairCount } = useMemo(() => {
    const picks = buildQuestionSet(words, 6);
    const cards: Card[] = [];
    picks.forEach((w) => {
      cards.push({ key: `${w.id}-w`, wordId: w.id, kind: 'word', label: w.word, isImg: false });
      cards.push({
        key: `${w.id}-p`,
        wordId: w.id,
        kind: 'pic',
        label: w.img || w.emoji || '📝',
        isImg: !!w.img,
      });
    });
    return { deck: shuffle(cards), pairCount: picks.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, seed]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const done = matched.size === pairCount && pairCount > 0;

  if (done) {
    return (
      <ResultsScreen
        score={pairCount}
        total={pairCount}
        results={[]}
        onPlayAgain={() => {
          setSeed((s) => s + 1);
          setFlipped([]);
          setMatched(new Set());
          setAttempts(0);
        }}
      />
    );
  }

  const cols = Math.min(4, Math.ceil(deck.length / 3));

  const click = (card: Card) => {
    if (busy || matched.has(card.wordId) || flipped.includes(card.key)) return;
    if (card.kind === 'word') speak(card.label);
    const next = [...flipped, card.key];
    setFlipped(next);
    if (next.length === 2) {
      setBusy(true);
      setAttempts((a) => a + 1);
      const [aKey, bKey] = next;
      const a = deck.find((c) => c.key === aKey)!;
      const b = deck.find((c) => c.key === bKey)!;
      if (a.wordId === b.wordId) {
        setTimeout(() => {
          setMatched((m) => new Set(m).add(a.wordId));
          setFlipped([]);
          setBusy(false);
        }, 500);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 900);
      }
    }
  };

  return (
    <GameShell title="Memory Match" icon="🃏" score={matched.size} progress={matched.size / pairCount}>
      <p className="mc-prompt">Flip two cards to match each word with its picture</p>
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {deck.map((card) => {
          const isMatched = matched.has(card.wordId);
          const isFlipped = flipped.includes(card.key) || isMatched;
          return (
            <div
              key={card.key}
              className={`memory-card${isFlipped ? ' flipped' : ''}${isMatched ? ' matched' : ''}`}
              onClick={() => click(card)}
            >
              {isFlipped ? (
                card.kind === 'pic' && card.isImg ? (
                  <img src={card.label} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                ) : card.kind === 'pic' ? (
                  <span>{card.label}</span>
                ) : (
                  <span className="mc-word">{card.label}</span>
                )
              ) : (
                '❓'
              )}
            </div>
          );
        })}
      </div>
      <p className="phonics-hint">Tries: {attempts}</p>
    </GameShell>
  );
}
