'use client';

import { useEffect, useState } from 'react';
import type { Word } from '@/lib/data/types';
import { PhonicsCard } from './PhonicsCard';
import { TrickyWordCard } from './TrickyWordCard';
import { AccentSelector } from '@/components/common/AccentSelector';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useSpeech } from '@/lib/tts/useSpeech';

export function FlashcardCarousel({ words }: { words: Word[] }) {
  const [idx, setIdx] = useState(0);
  const { settings } = useSettings();
  const { speak } = useSpeech();

  const current = words[idx];

  useEffect(() => {
    if (idx >= words.length) setIdx(0);
  }, [words.length, idx]);

  useEffect(() => {
    if (settings.autospeak && current) speak(current.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.id]);

  if (!current) return null;

  const prev = () => setIdx((i) => (i - 1 + words.length) % words.length);
  const next = () => setIdx((i) => (i + 1) % words.length);

  return (
    <div className="flashcard-area">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span className={`tag ${current.tricky ? 'tag-custom' : 'tag-lesson'}`}>
          {current.tricky ? 'Tricky Word' : 'Phonics Word'}
        </span>
      </div>
      <AccentSelector />
      {current.tricky ? <TrickyWordCard word={current} /> : <PhonicsCard word={current} />}
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
