'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useWordList } from '@/components/providers/WordListProvider';

export function GameShell({
  title,
  icon,
  score,
  progress,
  children,
}: {
  title: string;
  icon: string;
  score: number;
  /** 0..1 */
  progress: number;
  children: ReactNode;
}) {
  const { grade, weekPath } = useWordList();
  return (
    <div className="game-area">
      <div className="game-header">
        <Link href={`/grade/${grade}/${weekPath}/games`} className="btn btn-secondary btn-sm">
          ← Back
        </Link>
        <h2>
          {icon} {title}
        </h2>
        <div className="score-badge">⭐ {score}</div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      {children}
    </div>
  );
}
