'use client';

import { useEffect, useState } from 'react';
import type { Word } from '@/lib/data/types';
import { LessonCard } from './LessonCard';
import { AccentSelector } from '@/components/common/AccentSelector';
import { useSettings } from '@/components/providers/SettingsProvider';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';

export function FlashcardCarousel({ words }: { words: Word[] }) {
  const [idx, setIdx] = useState(0);
  const { settings } = useSettings();
  const { playWord, stop } = usePhonicsAudio();

  const current = words[idx];

  useEffect(() => {
    if (idx >= words.length) setIdx(0);
  }, [words.length, idx]);

  useEffect(() => {
    if (settings.autospeak && current) playWord(current.word, current.audioUrl);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.id]);

  if (!current) return null;

  const prev = () => {
    stop();
    setIdx((i) => (i - 1 + words.length) % words.length);
  };
  const next = () => {
    stop();
    setIdx((i) => (i + 1) % words.length);
  };

  return (
    <div className="flashcard-area">
      <div className="nav-arrows">
        <button onClick={prev} aria-label="Previous word">
          ←
        </button>
        <span className="word-counter">
          {idx + 1} / {words.length}
        </span>
        <button onClick={next} aria-label="Next word">
          →
        </button>
      </div>
      <LessonCard word={current} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span className={`tag ${current.tricky ? 'tag-custom' : 'tag-lesson'}`}>
          {current.tricky ? 'Tricky Word' : 'Spelling Word'}
        </span>
      </div>
      <AccentSelector />
    </div>
  );
}
