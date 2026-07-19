'use client';

import Link from 'next/link';
import { useWordList } from '@/components/providers/WordListProvider';
import { FlashcardCarousel } from './FlashcardCarousel';
import { WordGrid } from '@/components/word/WordGrid';

/**
 * "All words" lesson. The random sample lives in the shared AllWordsProvider
 * (the /all layout), so the same words are used here and in the games.
 */
export function AllLessonScreen() {
  const { grade, words, hydrated, reset } = useWordList();

  return (
    <div>
      <div className="subnav">
        <Link href={`/grade/${grade}`}>← Back</Link>
      </div>

      <div className="section-header">
        <h2>📖 All Words · random {words.length}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            🔀 New pick
          </button>
          <Link href={`/grade/${grade}/all/games`} className="btn btn-primary btn-sm">
            🎮 Play games
          </Link>
        </div>
      </div>

      {hydrated && words.length > 0 && (
        <>
          <FlashcardCarousel words={words} />
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text2)', marginBottom: 14 }}>
              THESE {words.length} WORDS
            </h3>
            <WordGrid words={words} />
          </div>
        </>
      )}
    </div>
  );
}
