'use client';

import { useState } from 'react';
import type { Word } from '@/lib/data/types';
import { useSpeech } from '@/lib/tts/useSpeech';

const TOOLTIP: Record<string, string> = {
  vowel: 'Vowel sound',
  consonant: 'Consonant sound',
  digraph: 'Two letters, one sound',
  blend: 'Blend — sounds glide together',
  vowelTeam: 'Vowel team — two letters, one vowel sound',
  rControlled: 'The r changes the vowel sound',
  silentE: "The e is silent — it makes the vowel say its name",
  other: 'Sound chunk',
};

export function PhonicsCard({ word }: { word: Word }) {
  const { speak, speakChunks } = useSpeech();
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const tapChunk = (i: number, text: string) => {
    setSpeakingIdx(i);
    speak(text, () => setSpeakingIdx(null));
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
        <div className="phonics-row">
          {word.chunks.map((c, i) => (
            <button
              key={i}
              className={`chunk chunk--${c.type}${speakingIdx === i ? ' speaking' : ''}`}
              title={TOOLTIP[c.type]}
              onClick={() => tapChunk(i, c.text)}
              aria-label={`Sound ${c.text}`}
            >
              {renderChunkText(c.text, c.type)}
            </button>
          ))}
        </div>
        <div className="flashcard-word" style={{ fontSize: 30 }}>
          {word.word}
        </div>
        <div className="flashcard-def">{word.def}</div>
        <button
          className="btn btn-primary blend-btn"
          onClick={() => speakChunks(word.chunks, { whole: word.word })}
        >
          🔊 Blend it: sound by sound → whole word
        </button>
        <p className="phonics-hint">Tap each colored chunk to hear its sound.</p>
      </div>
    </div>
  );
}
