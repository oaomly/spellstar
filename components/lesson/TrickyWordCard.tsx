'use client';

import { useState } from 'react';
import type { LessonMode, Word } from '@/lib/data/types';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';

/**
 * Sight words don't sound out — this card is a look/say/hear/memorize drill.
 * Letters are tappable (letter names) and can be spelled out, which is the
 * right way to learn an irregular word by heart. The `mode` toggle mainly
 * changes the emphasis; sounding-out isn't offered because it doesn't apply.
 */
export function TrickyWordCard({ word, mode }: { word: Word; mode: LessonMode }) {
  const { playWord, sayLetterName, spellLetters } = usePhonicsAudio();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const pulse = (i: number) => {
    setActiveIdx(i);
    setTimeout(() => setActiveIdx((cur) => (cur === i ? null : cur)), 400);
  };

  return (
    <div className="flashcard">
      <div className="flashcard-img">
        {word.img ? <img src={word.img} alt={word.word} /> : <span>{word.emoji || '🧠'}</span>}
      </div>
      <div className="flashcard-content">
        <span className="tricky-badge">⭐ Tricky Word — learn by heart</span>

        <div className="phonics-row">
          {word.word.split('').map((ch, i) => (
            <button
              key={i}
              className={`chunk chunk--silentE${activeIdx === i ? ' speaking' : ''}`}
              onClick={() => {
                pulse(i);
                sayLetterName(ch);
              }}
              aria-label={`Letter ${ch}`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="flashcard-word" style={{ fontSize: 30 }}>
          {word.word}
        </div>
        <div className="flashcard-def">{word.def}</div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => playWord(word.word, word.audioUrl)}>
            🔊 Say it
          </button>
          <button className="btn btn-secondary" onClick={() => spellLetters(word.word, word.audioUrl)}>
            🔤 Spell it out
          </button>
        </div>
        <p className="phonics-hint">
          {mode === 'sounds'
            ? "This word can't be sounded out — look, say, and remember it."
            : 'Tap each letter to hear its name, then spell it from memory.'}
        </p>
      </div>
    </div>
  );
}
