'use client';

import type { Word } from '@/lib/data/types';
import { useSpeech } from '@/lib/tts/useSpeech';

/** Sight words don't sound out — this card is a look/say/hear/memorize drill. */
export function TrickyWordCard({ word }: { word: Word }) {
  const { speak } = useSpeech();
  return (
    <div className="flashcard">
      <div className="flashcard-img">
        {word.img ? <img src={word.img} alt={word.word} /> : <span>{word.emoji || '🧠'}</span>}
      </div>
      <div className="flashcard-content">
        <span className="tricky-badge">⭐ Tricky Word — learn by heart</span>
        <div className="tricky-letters">
          {word.word.split('').map((ch, i) => (
            <span key={i} className="tricky-letter">
              {ch}
            </span>
          ))}
        </div>
        <div className="flashcard-word" style={{ fontSize: 30 }}>
          {word.word}
        </div>
        <div className="flashcard-def">{word.def}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => speak(word.word)}>
            🔊 Say it
          </button>
          {word.sentence && (
            <button className="btn btn-secondary" onClick={() => speak(word.sentence)}>
              💬 In a sentence
            </button>
          )}
        </div>
        <p className="phonics-hint">This word can&apos;t be sounded out — look, say, and remember it.</p>
      </div>
    </div>
  );
}
