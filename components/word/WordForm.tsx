'use client';

import { useEffect, useState } from 'react';
import type { PhonicsChunk, Word } from '@/lib/data/types';
import { splitChunks } from '@/lib/phonics/splitChunks';
import { suggestTricky } from '@/lib/phonics/suggestTricky';
import { lookupWord } from '@/lib/dictionary/lookup';
import { useSettings } from '@/components/providers/SettingsProvider';
import { ChunkEditor } from './ChunkEditor';

const EMOJIS = ['📝', '🌟', '🎯', '🌈', '🐶', '🐱', '🦊', '🐸', '🌺', '⭐', '🍎', '🎈', '🚀', '🏆', '🎵', '🚢', '🌧️', '💬'];

function newId(word: string) {
  return `${word.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
}

export function WordForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Word;
  onSave: (word: Word) => void;
  onCancel: () => void;
}) {
  const { settings } = useSettings();
  const [word, setWord] = useState(initial?.word ?? '');
  const [def, setDef] = useState(initial?.def ?? '');
  const [sentence, setSentence] = useState(initial?.sentence ?? '');
  const [img, setImg] = useState(initial?.img ?? '');
  const [tricky, setTricky] = useState(initial?.tricky ?? false);
  const [chunks, setChunks] = useState<PhonicsChunk[]>(initial?.chunks ?? []);
  const [chunksSource, setChunksSource] = useState<'auto' | 'manual'>(initial?.chunksSource ?? 'auto');
  const [suggestion, setSuggestion] = useState('');
  const [touchedTricky, setTouchedTricky] = useState(!!initial);

  // Dictionary-enriched fields (filled by "Look up").
  const [pronMw, setPronMw] = useState(initial?.pronMw);
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl);
  const [usage, setUsage] = useState<string[] | undefined>(initial?.usage);
  const [partOfSpeech, setPartOfSpeech] = useState(initial?.partOfSpeech);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'done' | 'notfound' | 'error'>('idle');

  // Auto-split + tricky suggestion as the word is typed (only for new/untouched words).
  useEffect(() => {
    const w = word.trim().toLowerCase();
    if (!w) {
      setSuggestion('');
      return;
    }
    const sug = suggestTricky(w);
    setSuggestion(sug.reason);
    if (!touchedTricky) setTricky(sug.tricky);
    if (chunksSource === 'auto') {
      setChunks(sug.tricky ? [] : splitChunks(w).chunks);
    }
    // Dictionary data belongs to a specific spelling — drop it if the word changed.
    if (w !== initial?.word) {
      setPronMw(undefined);
      setAudioUrl(undefined);
      setUsage(undefined);
      setPartOfSpeech(undefined);
      setLookupState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  const reSplit = () => {
    setChunks(splitChunks(word).chunks);
    setChunksSource('auto');
  };

  const doLookup = async () => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    setLookupState('loading');
    try {
      const entry = await lookupWord(w, settings.dictionaryApiKey);
      if (!entry) {
        setLookupState('notfound');
        return;
      }
      if (entry.pronMw) setPronMw(entry.pronMw);
      if (entry.audioUrl) setAudioUrl(entry.audioUrl);
      if (entry.usage.length) setUsage(entry.usage);
      if (entry.partOfSpeech) setPartOfSpeech(entry.partOfSpeech);
      if ((!def || !def.trim()) && entry.definitions[0]) setDef(entry.definitions[0]);
      if ((!sentence || !sentence.trim()) && entry.usage[0]) setSentence(entry.usage[0]);
      setLookupState('done');
    } catch {
      setLookupState('error');
    }
  };

  const handleChunkChange = (next: PhonicsChunk[]) => {
    setChunks(next);
    setChunksSource('manual');
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    onSave({
      id: initial?.id ?? newId(w),
      word: w,
      def: def.trim(),
      sentence: sentence.trim(),
      img: img || undefined,
      emoji: initial?.emoji ?? EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      tricky,
      chunks: tricky ? [] : chunks,
      chunksSource,
      pronMw,
      audioUrl,
      usage,
      partOfSpeech,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2>{initial ? 'Edit Word' : 'Add Word'}</h2>

        <div className="form-group">
          <label>Word *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. shop"
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={doLookup}
              disabled={!word.trim() || lookupState === 'loading'}
            >
              {lookupState === 'loading' ? '…' : '🔎 Look up'}
            </button>
          </div>
          {lookupState === 'done' && (
            <p className="phonics-hint" style={{ textAlign: 'left', color: 'var(--green)' }}>
              ✓ Filled from dictionary{pronMw ? ` · /${pronMw}/` : ''}
              {audioUrl ? ' · 🔊 audio' : ''}
            </p>
          )}
          {lookupState === 'notfound' && (
            <p className="phonics-hint" style={{ textAlign: 'left' }}>
              Not in the dictionary — fill in the details yourself.
            </p>
          )}
          {lookupState === 'error' && (
            <p className="phonics-hint" style={{ textAlign: 'left', color: 'var(--accent)' }}>
              Lookup unavailable (needs the dictionary proxy or your own key in Settings).
            </p>
          )}
        </div>

        {suggestion && (
          <div className="no-words-hint" style={{ marginBottom: 12 }}>
            💡 {suggestion}
          </div>
        )}

        <div className="form-group">
          <div className="setting-row" style={{ padding: 0, border: 'none' }}>
            <div>
              <div className="setting-label">Tricky word (sight word)</div>
              <div className="setting-sub">Skips sounding out — uses a memorize card.</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={tricky}
                onChange={(e) => {
                  setTricky(e.target.checked);
                  setTouchedTricky(true);
                  if (!e.target.checked && chunks.length === 0) reSplit();
                }}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {!tricky && (
          <div className="form-group">
            <label>Sound chunks (tap-editable)</label>
            <ChunkEditor chunks={chunks} onChange={handleChunkChange} />
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={reSplit}>
              ↻ Auto-split again
            </button>
          </div>
        )}

        <div className="form-group">
          <label>Definition</label>
          <textarea value={def} onChange={(e) => setDef(e.target.value)} placeholder="What does it mean?" />
        </div>

        <div className="form-group">
          <label>Example sentence</label>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="Use the word in a sentence"
          />
        </div>

        <div className="form-group">
          <label>Picture (optional)</label>
          <div className="img-upload-area">
            <input type="file" accept="image/*" onChange={handleImg} />
            <p>📷 Tap to upload an image (otherwise an emoji is used)</p>
          </div>
          {img && <img src={img} className="img-preview" alt="preview" />}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!word.trim()}>
            {initial ? 'Save' : 'Add Word'}
          </button>
        </div>
      </div>
    </div>
  );
}
