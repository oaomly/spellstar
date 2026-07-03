'use client';

import type { Word } from '@/lib/data/types';
import { usePhonicsAudio } from '@/lib/tts/usePhonicsAudio';

export function WordGrid({ words }: { words: Word[] }) {
  const { playWord } = usePhonicsAudio();
  return (
    <div className="words-grid">
      {words.map((w) => (
        <div key={w.id} className="word-card">
          <div className="word-card-img">
            {w.img ? <img src={w.img} alt={w.word} /> : <span className="no-img">{w.emoji || '📝'}</span>}
          </div>
          <div className="word-card-body">
            <h3>
              {w.word} {w.tricky && <span className="tag tag-custom">tricky</span>}
            </h3>
            <p>{w.def || 'No definition added yet.'}</p>
            <div className="word-card-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => playWord(w.word, w.audioUrl)}>
                🔊
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
