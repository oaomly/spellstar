'use client';

import Link from 'next/link';
import { useWordList } from '@/components/providers/WordListProvider';
import { GAMES } from '@/lib/gameEngine/registry';

export function GameMenu() {
  const { words, grade, weekPath } = useWordList();
  const base = `/grade/${grade}/${weekPath}/games`;

  return (
    <div>
      <div className="section-header">
        <h2>🎮 Games</h2>
      </div>
      {words.length === 0 && (
        <div className="no-words-hint">Add words in the Manage tab first before playing games!</div>
      )}
      <div className="exercises-grid">
        {GAMES.map((g) => {
          const locked = words.length < g.minWords;
          const inner = (
            <>
              <div className="ex-icon">{g.icon}</div>
              <h3>{g.title}</h3>
              <p>{g.desc}</p>
              {g.phonics && <span className="ex-tag">phonics</span>}
            </>
          );
          return locked ? (
            <div key={g.id} className="exercise-card" style={{ opacity: 0.45, cursor: 'default' }}>
              {inner}
            </div>
          ) : (
            <Link key={g.id} href={`${base}/${g.id}`} className="exercise-card">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
