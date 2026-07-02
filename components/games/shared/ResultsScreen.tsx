'use client';

import Link from 'next/link';
import type { GameResult } from '@/lib/data/types';
import { useWordList } from '@/components/providers/WordListProvider';
import { Confetti } from '@/components/common/Confetti';
import { useEffect, useState } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';

export function ResultsScreen({
  score,
  total,
  results,
  onPlayAgain,
}: {
  score: number;
  total: number;
  results: GameResult[];
  onPlayAgain: () => void;
}) {
  const { grade, week } = useWordList();
  const { settings } = useSettings();
  const [burst, setBurst] = useState(0);
  const pct = total > 0 ? score / total : 0;
  const stars = pct >= 0.8 ? '⭐⭐⭐' : pct >= 0.5 ? '⭐⭐' : '⭐';

  useEffect(() => {
    if (settings.confetti && pct >= 0.5) setBurst(Date.now());
  }, [settings.confetti, pct]);

  return (
    <div className="result-card">
      {settings.confetti && pct >= 0.5 && <Confetti trigger={burst} />}
      <div className="result-stars">{stars}</div>
      <div className="result-score">
        {score}/{total}
      </div>
      <div className="result-label">
        {pct >= 0.8 ? 'Fantastic work! 🎉' : pct >= 0.5 ? 'Nice job! Keep going 💪' : 'Good try — practise makes perfect!'}
      </div>
      {results.length > 0 && (
        <div className="result-items">
          {results.map((r, i) => (
            <div key={i} className="result-item">
              <span className="ri-word">{r.word}</span>
              <span className="ri-status">{r.correct ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>
      )}
      <div className="result-actions">
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again 🔄
        </button>
        <Link href={`/grade/${grade}/week/${week}/games`} className="btn btn-secondary">
          Back to Games
        </Link>
      </div>
    </div>
  );
}
