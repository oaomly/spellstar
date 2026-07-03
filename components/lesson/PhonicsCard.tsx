'use client';

import { useState } from 'react';
import type { LessonMode, Word } from '@/lib/data/types';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';

const TOOLTIP: Record<string, string> = {
  vowel: 'Vowel sound',
  consonant: 'Consonant sound',
  digraph: 'Two letters, one sound',
  blend: 'Blend — sounds glide together',
  vowelTeam: 'Vowel team — two letters, one vowel sound',
  rControlled: 'The r changes the vowel sound',
  silentE: 'The e is silent — it makes the vowel say its name',
  other: 'Sound chunk',
};

export function PhonicsCard({ word, mode }: { word: Word; mode: LessonMode }) {
  const { playChunkSound, sayLetterName, blendSounds, spellLetters } = usePhonicsAudio();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const pulse = (i: number) => {
    setActiveIdx(i);
    setTimeout(() => setActiveIdx((cur) => (cur === i ? null : cur)), 400);
  };

  const renderChunkText = (text: string, type: string) => {
    if (type === 'silentE' && text.length === 2) {
      return (
        <>
          {text[0]}
          <span className="silent-e">{text[1]}</span>
        </>
      );
    }
    return text;
  };

  return (
    <div className="flashcard">
      <div className="flashcard-img">
        {word.img ? <img src={word.img} alt={word.word} /> : <span>{word.emoji || '📝'}</span>}
      </div>
      <div className="flashcard-content">
        {mode === 'sounds' ? (
          <div className="phonics-row">
            {word.chunks.map((c, i) => (
              <button
                key={i}
                className={`chunk chunk--${c.type}${activeIdx === i ? ' speaking' : ''}`}
                title={TOOLTIP[c.type]}
                onClick={() => {
                  pulse(i);
                  playChunkSound(c);
                }}
                aria-label={`Sound ${c.text}`}
              >
                {renderChunkText(c.text, c.type)}
              </button>
            ))}
          </div>
        ) : (
          <div className="phonics-row">
            {word.word.split('').map((ch, i) => (
              <button
                key={i}
                className={`chunk chunk--consonant${activeIdx === i ? ' speaking' : ''}`}
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
        )}

        <div className="flashcard-word" style={{ fontSize: 30 }}>
          {word.word}
        </div>
        <div className="flashcard-def">{word.def}</div>

        {mode === 'sounds' ? (
          <>
            <button
              className="btn btn-primary blend-btn"
              onClick={() => blendSounds(word.chunks, word.word)}
            >
              🔊 Blend the sounds → whole word
            </button>
            <p className="phonics-hint">Tap each colored chunk to hear its sound.</p>
          </>
        ) : (
          <>
            <button className="btn btn-primary blend-btn" onClick={() => spellLetters(word.word)}>
              🔤 Spell it out → whole word
            </button>
            <p className="phonics-hint">Tap each letter to hear its name.</p>
          </>
        )}
      </div>
    </div>
  );
}
