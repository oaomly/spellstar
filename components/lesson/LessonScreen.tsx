'use client';

import Link from 'next/link';
import { useWordList } from '@/components/providers/WordListProvider';
import { FlashcardCarousel } from './FlashcardCarousel';
import { WordGrid } from '@/components/word/WordGrid';

export function LessonScreen() {
  const { words, grade, week, hydrated } = useWordList();

  if (hydrated && words.length === 0) {
    return (
      <div className="empty-state">
        <div className="es-icon">📚</div>
        <h3>No words yet!</h3>
        <p>Add this week&apos;s spelling words to get started.</p>
        <Link href={`/grade/${grade}/week/${week}/manage`} className="btn btn-primary">
          ＋ Add Words
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h2>📖 Lesson</h2>
        <Link href={`/grade/${grade}/week/${week}/manage`} className="btn btn-secondary btn-sm">
          ✏️ Manage
        </Link>
      </div>
      <FlashcardCarousel words={words} />
      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text2)', marginBottom: 14 }}>
          ALL WORDS
        </h3>
        <WordGrid words={words} />
      </div>
    </div>
  );
}
