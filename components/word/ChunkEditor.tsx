'use client';

import type { PhonicsChunk, ChunkType } from '@/lib/data/types';

const TYPES: ChunkType[] = [
  'consonant',
  'vowel',
  'digraph',
  'blend',
  'vowelTeam',
  'rControlled',
  'silentE',
  'other',
];

export function ChunkEditor({
  chunks,
  onChange,
}: {
  chunks: PhonicsChunk[];
  onChange: (chunks: PhonicsChunk[]) => void;
}) {
  const setText = (i: number, text: string) => {
    const next = chunks.map((c, j) => (j === i ? { ...c, text } : c));
    onChange(next);
  };
  const setType = (i: number, type: ChunkType) => {
    const next = chunks.map((c, j) => (j === i ? { ...c, type } : c));
    onChange(next);
  };
  const remove = (i: number) => onChange(chunks.filter((_, j) => j !== i));
  const add = () => onChange([...chunks, { text: '', type: 'other' }]);

  return (
    <div>
      <div className="chunk-editor">
        {chunks.map((c, i) => (
          <div key={i} className="chunk-edit-pill">
            <input
              value={c.text}
              onChange={(e) => setText(i, e.target.value)}
              aria-label={`Chunk ${i + 1} text`}
            />
            <select
              value={c.type}
              onChange={(e) => setType(i, e.target.value as ChunkType)}
              aria-label={`Chunk ${i + 1} type`}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--primary)',
                width: 'auto',
                padding: 0,
              }}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => remove(i)} aria-label={`Remove chunk ${i + 1}`}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="chunk-add-btn" onClick={add}>
          + chunk
        </button>
      </div>
      <p className="phonics-hint" style={{ textAlign: 'left', marginTop: 6 }}>
        Preview: {chunks.map((c) => c.text).join(' · ') || '—'}
      </p>
    </div>
  );
}
