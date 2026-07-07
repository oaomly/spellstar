'use client';

import { useMemo } from 'react';
import type { Word } from '@/lib/data/types';
import { wordIpa } from '@/lib/phonics/chunkPhonemes';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';

/**
 * Simple word card: image/emoji, the word, its IPA (from the dictionary),
 * recorded audio, definition, and an example sentence. No phonics segmentation —
 * the letter↔sound alignment proved unreliable, so we show the dictionary's own
 * pronunciation instead.
 */
export function LessonCard({ word }: { word: Word }) {
  const { playWord } = usePhonicsAudio();
  const ipa = useMemo(() => wordIpa(word), [word]);

  return (
    <div className="flashcard">
      <div className="flashcard-img">
        {word.img ? <img src={word.img} alt={word.word} /> : <span>{word.emoji || '📝'}</span>}
      </div>
      <div className="flashcard-content">
        {word.tricky && <span className="tricky-badge">⭐ Tricky Word — learn by heart</span>}
        <div className="flashcard-word">{word.word}</div>
        {(ipa || word.partOfSpeech) && (
          <div className="pron-line">
            {ipa && <span className="ipa">/{ipa}/</span>}
            {word.partOfSpeech && <span className="pos">{word.partOfSpeech}</span>}
          </div>
        )}
        <button
          className="btn btn-primary blend-btn"
          onClick={() => playWord(word.word, word.audioUrl)}
        >
          🔊 Hear the word
        </button>
        <div className="flashcard-def">{word.def}</div>
        {word.usage && word.usage.length > 0 && <div className="usage-example">“{word.usage[0]}”</div>}
      </div>
    </div>
  );
}
