'use client';

import { useMemo, useState } from 'react';
import type { LessonMode, Word } from '@/lib/data/types';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';
import { chunkPhonemes, wordIpa } from '@/lib/phonics/chunkPhonemes';

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
  const { playChunkSound, sayLetterName, blendSounds, spellLetters, playWord } = usePhonicsAudio();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const ipa = useMemo(() => wordIpa(word), [word]);
  const chunkIpa = useMemo(() => (mode === 'sounds' ? chunkPhonemes(word) : null), [word, mode]);

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
                {chunkIpa && chunkIpa[i] ? <span className="chunk-ipa">{chunkIpa[i]}</span> : null}
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
        {(ipa || word.partOfSpeech) && (
          <div className="pron-line">
            {ipa && <span className="ipa">/{ipa.replace(/^ˈ/, 'ˈ')}/</span>}
            {word.partOfSpeech && <span className="pos">{word.partOfSpeech}</span>}
            <button
              className="mini-audio"
              onClick={() => playWord(word.word, word.audioUrl)}
              aria-label={`Hear ${word.word}`}
              title={word.audioUrl ? 'Play recorded pronunciation' : 'Play (computer voice)'}
            >
              🔊
            </button>
          </div>
        )}
        <div className="flashcard-def">{word.def}</div>
        {word.usage && word.usage.length > 0 && (
          <div className="usage-example">“{word.usage[0]}”</div>
        )}

        {mode === 'sounds' ? (
          <>
            <button
              className="btn btn-primary blend-btn"
              onClick={() => blendSounds(word.chunks, word.word, word.audioUrl)}
            >
              🔊 Blend the sounds → whole word
            </button>
            <p className="phonics-hint">Tap each colored chunk to hear its sound.</p>
          </>
        ) : (
          <>
            <button
              className="btn btn-primary blend-btn"
              onClick={() => spellLetters(word.word, word.audioUrl)}
            >
              🔤 Spell it out → whole word
            </button>
            <p className="phonics-hint">Tap each letter to hear its name.</p>
          </>
        )}
      </div>
    </div>
  );
}
