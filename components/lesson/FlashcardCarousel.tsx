'use client';

import { useEffect, useState } from 'react';
import type { LessonMode, Word } from '@/lib/data/types';
import { PhonicsCard } from './PhonicsCard';
import { TrickyWordCard } from './TrickyWordCard';
import { AccentSelector } from '@/components/common/AccentSelector';
import { useSettings } from '@/components/providers/SettingsProvider';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';

export function FlashcardCarousel({ words }: { words: Word[] }) {
  const [idx, setIdx] = useState(0);
  const { settings, update } = useSettings();
  const { speakWord, stop } = usePhonicsAudio();
  const mode: LessonMode = settings.lessonMode;

  const current = words[idx];

  useEffect(() => {
    if (idx >= words.length) setIdx(0);
  }, [words.length, idx]);

  useEffect(() => {
    if (settings.autospeak && current) speakWord(current.word);
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
      <div className="seg" role="tablist" aria-label="Lesson mode">
        <button
          className={`seg-btn${mode === 'sounds' ? ' active' : ''}`}
          onClick={() => update({ lessonMode: 'sounds' })}
          role="tab"
          aria-selected={mode === 'sounds'}
        >
          🔊 Sounds
        </button>
        <button
          className={`seg-btn${mode === 'letters' ? ' active' : ''}`}
          onClick={() => update({ lessonMode: 'letters' })}
          role="tab"
          aria-selected={mode === 'letters'}
        >
          🔤 Letter names
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span className={`tag ${current.tricky ? 'tag-custom' : 'tag-lesson'}`}>
          {current.tricky ? 'Tricky Word' : mode === 'sounds' ? 'Phonics — sounds' : 'Phonics — letters'}
        </span>
      </div>
      <AccentSelector />

      {current.tricky ? (
        <TrickyWordCard word={current} mode={mode} />
      ) : (
        <PhonicsCard word={current} mode={mode} />
      )}

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
    </div>
  );
}
